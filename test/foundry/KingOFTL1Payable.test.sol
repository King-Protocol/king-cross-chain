// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Mock imports
import { KingOFTL2PayableMock } from "../../contracts/mocks/KingOFTL2PayableMock.sol";
import { KingOFTL1PayableMock } from "../../contracts/mocks/KingOFTL1PayableMock.sol";
import { MyERC20Mock } from "../../contracts/mocks/MyERC20Mock.sol";
import { KingOFTL1 } from "../../contracts/KingOFTL1.sol";
import { PairwiseRateLimiter } from "../../contracts/PairwiseRateLimiter.sol";
import { OFTComposerMock } from "../../contracts/mocks/OFTComposerMock.sol";
import { ProxyAdmin } from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import { TransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
// OApp imports
import { IOAppOptionsType3, EnforcedOptionParam } from "layerzero-v2/oapp/contracts/oapp/libs/OAppOptionsType3Upgradeable.sol";
import { OptionsBuilder } from "layerzero-v2/oapp/contracts/oapp/libs/OptionsBuilder.sol";

// OFT imports
import { IOFT, SendParam, OFTReceipt } from "layerzero-v2/oapp/contracts/oft/interfaces/IOFT.sol";
import { MessagingFee, MessagingReceipt } from "layerzero-v2/oapp/contracts/oft/OFTCoreUpgradeable.sol";
import { OFTMsgCodec } from "layerzero-v2/oapp/contracts/oft/libs/OFTMsgCodec.sol";
import { OFTComposeMsgCodec } from "layerzero-v2/oapp/contracts/oft/libs/OFTComposeMsgCodec.sol";

// OZ imports
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// Forge imports
import "forge-std/console.sol";

// DevTools imports
import { TestHelperOz5 } from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";

contract KingOFTL1Test is TestHelperOz5 {

    struct SendData {
            uint256 tokensToSend;
            uint256 fee;
            OFTComposerMock composer;
            bytes options;
            bytes composeMsg;
            SendParam sendParam;
            MessagingFee feeData;
        }

    using OptionsBuilder for bytes;

    uint32 private aEid = 1;
    uint32 private bEid = 2;

    MyERC20Mock private aToken;
    KingOFTL1PayableMock private aOFTAdapter;
    KingOFTL2PayableMock private bOFT;

    address private userA = address(0x1);
    address private userB = address(0x2);
    address private treasury = address(0x3);
    uint256 private initialBalance = 100 ether;

    function setUp() public override {
        vm.deal(userA, 1000 ether);
        vm.deal(userB, 1000 ether);

        super.setUp();
        setUpEndpoints(2, LibraryType.UltraLightNode);

        aToken = MyERC20Mock(_deployOApp(type(MyERC20Mock).creationCode, abi.encode("Token", "TOKEN")));

        bytes32 saltL1 = keccak256(abi.encodePacked("Token", "L1"));

        KingOFTL1PayableMock implA = new KingOFTL1PayableMock{ salt: saltL1 }(
            address(aToken),
            address(endpoints[aEid]),
            address(this)
        );

        TransparentUpgradeableProxy proxyA = new TransparentUpgradeableProxy(address(implA), address(this), bytes(""));

        aOFTAdapter = KingOFTL1PayableMock(payable(address(proxyA)));
        aOFTAdapter.initialize(address(this), address(this));
        PairwiseRateLimiter.RateLimitConfig memory rateLimitA = PairwiseRateLimiter.RateLimitConfig(bEid, 500 ether, 1);
        PairwiseRateLimiter.RateLimitConfig[] memory rateLimitAArr = new PairwiseRateLimiter.RateLimitConfig[](1);
        rateLimitAArr[0] = rateLimitA;

        aOFTAdapter.setOutboundRateLimits(rateLimitAArr);
        bytes32 saltL2 = keccak256(abi.encodePacked("KingOFTL2", "L2"));

        KingOFTL2PayableMock implB = new KingOFTL2PayableMock{ salt: saltL2 }(address(endpoints[bEid]));
        TransparentUpgradeableProxy proxyB = new TransparentUpgradeableProxy{ salt: saltL2 }(
            address(implB),
            address(this),
            bytes("")
        );

        bOFT = KingOFTL2PayableMock(payable(address(proxyB)));

        bOFT.initialize("KingOFTL2", "KING", address(this));
        PairwiseRateLimiter.RateLimitConfig memory rateLimitB = PairwiseRateLimiter.RateLimitConfig(aEid, 500 ether, 1);
        PairwiseRateLimiter.RateLimitConfig[] memory rateLimitBArr = new PairwiseRateLimiter.RateLimitConfig[](1);
        rateLimitBArr[0] = rateLimitB;
        bOFT.setInboundRateLimits(rateLimitBArr);
        address[] memory ofts = new address[](2);
        ofts[0] = address(aOFTAdapter);
        ofts[1] = address(bOFT);

        this.wireOApps(ofts);
        aToken.mint(userA, initialBalance);
        aOFTAdapter.setTreasury(treasury);
        bOFT.setTreasury(treasury);
        aOFTAdapter.setDefaultFeeBps(100);
        bOFT.setDefaultFeeBps(100);
        aOFTAdapter.setFeeBps(bEid, 1000, true);
        bOFT.setFeeBps(aEid, 1000, true);
    }

    function test_constructor() public {
        assertEq(aOFTAdapter.owner(), address(this));
        assertEq(bOFT.owner(), address(this));

        assertEq(aToken.balanceOf(userA), initialBalance);
        assertEq(aToken.balanceOf(address(aOFTAdapter)), 0);
        assertEq(bOFT.balanceOf(userB), 0);

        assertEq(aOFTAdapter.token(), address(aToken));
        assertEq(bOFT.token(), address(bOFT));
    }

    function test_send_oft_adapter() public {
        uint256 tokensToSend = 1 ether;
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0);
        uint256 _fee = (tokensToSend * 1000) / 10000;
        SendParam memory sendParam = SendParam(
            bEid,
            addressToBytes32(userB),
            tokensToSend,
            tokensToSend - _fee,
            options,
            "",
            ""
        );
        MessagingFee memory fee = aOFTAdapter.quoteSend(sendParam, false);

        assertEq(aToken.balanceOf(userA), initialBalance);
        assertEq(aToken.balanceOf(address(aOFTAdapter)), 0);
        assertEq(bOFT.balanceOf(userB), 0);

        vm.prank(userA);
        aToken.approve(address(aOFTAdapter), tokensToSend);

        vm.prank(userA);
        aOFTAdapter.send{ value: fee.nativeFee }(sendParam, fee, payable(address(this)));
        verifyPackets(bEid, addressToBytes32(address(bOFT)));

        assertEq(aToken.balanceOf(userA), initialBalance - tokensToSend);
        assertEq(aToken.balanceOf(address(aOFTAdapter)), tokensToSend - _fee);
        assertEq(bOFT.balanceOf(userB), tokensToSend - _fee);
        assertEq(aToken.balanceOf(treasury), _fee);
    }

    function test_send_oft_adapter_compose_msg() public {
        

        SendData memory data;
        data.tokensToSend = 1 ether;
        data.fee = (data.tokensToSend * 1000) / 10000;
        data.composer = new OFTComposerMock();

        data.options = OptionsBuilder
            .newOptions()
            .addExecutorLzReceiveOption(200000, 0)
            .addExecutorLzComposeOption(0, 500000, 0);
        data.composeMsg = hex"1234";
        data.sendParam = SendParam(
            bEid,
            addressToBytes32(address(data.composer)),
            data.tokensToSend,
            data.tokensToSend - data.fee,
            data.options,
            data.composeMsg,
            ""
        );
        data.feeData = aOFTAdapter.quoteSend(data.sendParam, false);

        assertEq(aToken.balanceOf(userA), initialBalance);
        assertEq(aToken.balanceOf(address(aOFTAdapter)), 0);
        assertEq(bOFT.balanceOf(userB), 0);

        vm.prank(userA);
        aToken.approve(address(aOFTAdapter), data.tokensToSend);

        vm.prank(userA);
        (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) = aOFTAdapter.send{ value: data.feeData.nativeFee }(
            data.sendParam,
            data.feeData,
            payable(address(this))
        );
        verifyPackets(bEid, addressToBytes32(address(bOFT)));

        // lzCompose params
        uint32 dstEid_ = bEid;
        address from_ = address(bOFT);
        bytes memory options_ = data.options;
        bytes32 guid_ = msgReceipt.guid;
        address to_ = address(data.composer);
        bytes memory composerMsg_ = OFTComposeMsgCodec.encode(
            msgReceipt.nonce,
            aEid,
            oftReceipt.amountReceivedLD,
            abi.encodePacked(addressToBytes32(userA), data.composeMsg)
        );
        this.lzCompose(dstEid_, from_, options_, guid_, to_, composerMsg_);

        assertEq(aToken.balanceOf(userA), initialBalance - data.tokensToSend);
        assertEq(aToken.balanceOf(address(aOFTAdapter)), data.tokensToSend - data.fee);
        assertEq(bOFT.balanceOf(address(data.composer)), data.tokensToSend - data.fee);

        assertEq(data.composer.guid(), guid_);
        assertEq(data.composer.message(), composerMsg_);
        assertEq(data.composer.executor(), address(this));
        assertEq(data.composer.extraData(), composerMsg_); // default to setting the extraData to the message as well to test
    }

    // TODO import the rest of oft tests?
}
