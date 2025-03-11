// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import { KingOFTL1 } from "../../contracts/KingOFTL1.sol";
import { KingOFTL2 } from "../../contracts/KingOFTL2.sol";
import { KingOFTL1Payable } from "../../contracts/KingOFTL1Payable.sol";
import { KingOFTL2Payable } from "../../contracts/KingOFTL2Payable.sol";
import { MyERC20Mock } from "../../contracts/mocks/MyERC20Mock.sol";
import { PairwiseRateLimiter } from "../../contracts/PairwiseRateLimiter.sol";
import { TestHelperOz5 } from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";

contract KingOFTUpgradeTest is TestHelperOz5 {
    // These are the known addresses on their respective chains.
    address constant ADMIN_L1 = 0x4b70e85217DB7cA09843e81604EF88E15c20177F;
    address constant ADMIN_L2 = 0x18C6d75FB422f7B28bC8c1EdDea88C11d4d7C2E1;
    address constant KING_OFT_L1_PROXY = 0x4c8A4521F2431b0aC003829ac4e6dBC4Ed97707d;
    address constant KING_OFT_L2_PROXY = 0xc2606AADe4bdd978a4fa5a6edb3b66657acEe6F8;
    address constant KING_L1 = 0x8F08B70456eb22f6109F57b8fafE862ED28E6040;

    MyERC20Mock private aToken;
    KingOFTL1 private aOFT;
    KingOFTL2 private bOFT;

    uint256 forkL1;
    uint256 forkL2;

    function setUp() public override {
        address userA = address(0x1);
        address userB = address(0x2);
        vm.deal(userA, 1000 ether);
        vm.deal(userB, 1000 ether);

        super.setUp();
        setUpEndpoints(2, LibraryType.UltraLightNode);
        aToken = MyERC20Mock(KING_L1);
        aOFT = KingOFTL1(payable(KING_OFT_L1_PROXY));
        bOFT = KingOFTL2(payable(KING_OFT_L2_PROXY));
        forkL1 = vm.createSelectFork(vm.envString("RPC_URL_MAINNET"));
        forkL2 = vm.createSelectFork(vm.envString("RPC_URL_SWELL"));
    }

    function test_upgradeToPayableImplSwitchForks() public {
        vm.selectFork(forkL1);
        address endpointL1 = address(aOFT.endpoint());
        KingOFTL1Payable newL1Impl = new KingOFTL1Payable(address(aToken), endpointL1);

        bytes memory upgradeDataL1 = abi.encodeWithSignature("upgradeToAndCall(address,bytes)", address(newL1Impl), "");

        vm.prank(ADMIN_L1);
        (bool successL1, ) = KING_OFT_L1_PROXY.call{ value: 0 }(upgradeDataL1);
        require(successL1, "L1 upgrade failed");

        vm.selectFork(forkL2);
        address endpointL2 = address(bOFT.endpoint());
        KingOFTL2Payable newL2Impl = new KingOFTL2Payable(endpointL2);
        
        bytes memory upgradeDataL2 = abi.encodeWithSignature("upgradeToAndCall(address,bytes)", address(newL2Impl), "");

        vm.prank(ADMIN_L2);
        (bool successL2, ) = KING_OFT_L2_PROXY.call{ value: 0 }(upgradeDataL2);
        require(successL2, "L2 upgrade failed");
        
        KingOFTL2Payable upgradedL2 = KingOFTL2Payable(payable(KING_OFT_L2_PROXY));
        require(address(upgradedL2.endpoint()) == endpointL2, "L2 endpoint mismatch");
    }
}
