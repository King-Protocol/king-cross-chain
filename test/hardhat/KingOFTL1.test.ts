import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('KingOFTL1 Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let KingOFTL1: ContractFactory
    let KingOFTL2: ContractFactory
    let ERC20Mock: ContractFactory
    let EndpointV2Mock: ContractFactory
    let deployer: SignerWithAddress
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let token: Contract
    let kingOFTL1: Contract
    let kingOFTL2: Contract
    let L1Impl, L2Impl;     // Implementation contract factories
    let l1ImplInstance;      // Actual deployed L1 implementation
    let l2ImplInstance;      // Actual deployed L2 implementation
    let ProxyFactory;       // TransparentUpgradeableProxy factory
    let l1Proxy, l2Proxy;
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        KingOFTL1 = await ethers.getContractFactory('KingOFTL1Mock')

        KingOFTL2 = await ethers.getContractFactory('KingOFTL2Mock')

        ERC20Mock = await ethers.getContractFactory('MyERC20Mock')

        const signers = await ethers.getSigners()

        ;[deployer, ownerA, ownerB, endpointOwner] = signers
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)

        token = await ERC20Mock.deploy('Token', 'TOKEN')

        L1Impl = await ethers.getContractFactory("KingOFTL1Mock");
        l1ImplInstance = await L1Impl.deploy(
          token.address,
          mockEndpointV2A.address,
          deployer.address
        );
        await l1ImplInstance.deployed();
       
        ProxyFactory = await ethers.getContractFactory("UUPS");
        l1Proxy = await ProxyFactory.deploy(
          l1ImplInstance.address,
          deployer.address,
          "0x"
        );
        await l1Proxy.deployed();
    
        kingOFTL1 = await ethers.getContractAt("KingOFTL1Mock", l1Proxy.address);
    
        await kingOFTL1.initialize(deployer.address, deployer.address);
    
        L2Impl = await ethers.getContractFactory("KingOFTL2Mock");
        l2ImplInstance = await L2Impl.deploy(
            mockEndpointV2B.address,
        );
        await l2ImplInstance.deployed();
        l2Proxy = await ProxyFactory.deploy(
          l2ImplInstance.address,
          deployer.address,
          "0x"
        );
        await l2Proxy.deployed();
        console.log("L2 Proxy deployed at:", l2Proxy.address);
    
      
        kingOFTL2 = await ethers.getContractAt("KingOFTL2Mock", l2Proxy.address);
        await kingOFTL2.initialize("KingOFTL2", "KING", deployer.address);
        const rateLimitA = [[eidB, ethers.utils.parseEther('500'), 1]];
        const rateLimitB = [[eidA, ethers.utils.parseEther('500'), 1]];
        await kingOFTL1.connect(deployer).setInboundRateLimits(rateLimitA);
        await kingOFTL1.connect(deployer).setOutboundRateLimits(rateLimitA);
        
        await kingOFTL2.connect(deployer).setInboundRateLimits(rateLimitB);
        await kingOFTL2.connect(deployer).setOutboundRateLimits(rateLimitB);

        // Setting destination endpoints in the LZEndpoint mock for each KingOFTL2 instance
        await mockEndpointV2A.setDestLzEndpoint(kingOFTL2.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(kingOFTL1.address, mockEndpointV2A.address)

        // Setting each KingOFTL2 instance as a peer of the other in the mock LZEndpoint
        await kingOFTL1.connect(deployer).setPeer(eidB, ethers.utils.zeroPad(kingOFTL2.address, 32))
        await kingOFTL2.connect(deployer).setPeer(eidA, ethers.utils.zeroPad(kingOFTL1.address, 32))
    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via OFTAdapter/OFT', async function () {
        // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
        const initialAmount = ethers.utils.parseEther('100')
        await token.mint(ownerA.address, initialAmount)

        // Defining the amount of tokens to send and constructing the parameters for the send operation
        const tokensToSend = ethers.utils.parseEther('1')

        // Defining extra message execution options for the send operation
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            tokensToSend,
            tokensToSend,
            options,
            '0x',
            '0x',
        ]

        // Fetching the native fee for the token send operation
        const [nativeFee] = await kingOFTL1.quoteSend(sendParam, false)

        // Approving the native fee to be spent by the myOFTA contract
        await token.connect(ownerA).approve(kingOFTL1.address, tokensToSend)

        // Executing the send operation from myOFTA contract
        await kingOFTL1.connect(ownerA).send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        // Fetching the final token balances of ownerA and ownerB
        const finalBalanceA = await token.balanceOf(ownerA.address)
        const finalBalanceAdapter = await token.balanceOf(kingOFTL1.address)
        const finalBalanceB = await kingOFTL2.balanceOf(ownerB.address)

        // Asserting that the final balances are as expected after the send operation
        expect(finalBalanceA).eql(initialAmount.sub(tokensToSend))
        expect(finalBalanceAdapter).eql(tokensToSend)
        expect(finalBalanceB).eql(tokensToSend)
    })

    it('should not send tokens if paused. Procceed if unpoused', async function () {
        const initialAmount = ethers.utils.parseEther('100')
        await token.mint(ownerA.address, initialAmount)

        const tokensToSend = ethers.utils.parseEther('1')

        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            tokensToSend,
            tokensToSend,
            options,
            '0x',
            '0x',
        ]

        const [nativeFee] = await kingOFTL1.quoteSend(sendParam, false)

        await token.connect(ownerA).approve(kingOFTL1.address, tokensToSend)
        const PAUSER_ROLE = await kingOFTL1.PAUSER_ROLE();
        await kingOFTL1.connect(deployer).grantRole(PAUSER_ROLE, deployer.address);
        await kingOFTL1.connect(deployer).pauseBridge();

        await expect(
            kingOFTL1.send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })
        ).to.be.revertedWithCustomError(kingOFTL1, "EnforcedPause");
        const UNPAUSER_ROLE = await kingOFTL1.UNPAUSER_ROLE();
        await kingOFTL1.connect(deployer).grantRole(UNPAUSER_ROLE, deployer.address);
        await kingOFTL1.unpauseBridge();

        await kingOFTL1.connect(ownerA).send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        const finalBalanceA = await token.balanceOf(ownerA.address)
        const finalBalanceAdapter = await token.balanceOf(kingOFTL1.address)
        const finalBalanceB = await kingOFTL2.balanceOf(ownerB.address)

        expect(finalBalanceA).eql(initialAmount.sub(tokensToSend))
        expect(finalBalanceAdapter).eql(tokensToSend)
        expect(finalBalanceB).eql(tokensToSend)
    });
})
