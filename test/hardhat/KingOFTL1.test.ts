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
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let token: Contract
    let kingOFTL1: Contract
    let kingOFTL2: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        KingOFTL1 = await ethers.getContractFactory('KingOFTL1Mock')

        KingOFTL2 = await ethers.getContractFactory('KingOFTL2Mock')

        ERC20Mock = await ethers.getContractFactory('MyERC20Mock')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        ;[ownerA, ownerB, endpointOwner] = signers

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)

        token = await ERC20Mock.deploy('Token', 'TOKEN')

        // Deploying two instances of KingOFTL2 contract with different identifiers and linking them to the mock LZEndpoint
        kingOFTL1 = await KingOFTL1.deploy(token.address, mockEndpointV2A.address, ownerA.address)
        kingOFTL2 = await KingOFTL2.deploy('KING', 'KING', mockEndpointV2B.address, ownerB.address)

        // Setting destination endpoints in the LZEndpoint mock for each KingOFTL2 instance
        await mockEndpointV2A.setDestLzEndpoint(kingOFTL2.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(kingOFTL1.address, mockEndpointV2A.address)

        // Setting each KingOFTL2 instance as a peer of the other in the mock LZEndpoint
        await kingOFTL1.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(kingOFTL2.address, 32))
        await kingOFTL2.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(kingOFTL1.address, 32))
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
        await kingOFTL1.send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        // Fetching the final token balances of ownerA and ownerB
        const finalBalanceA = await token.balanceOf(ownerA.address)
        const finalBalanceAdapter = await token.balanceOf(kingOFTL1.address)
        const finalBalanceB = await kingOFTL2.balanceOf(ownerB.address)

        // Asserting that the final balances are as expected after the send operation
        expect(finalBalanceA).eql(initialAmount.sub(tokensToSend))
        expect(finalBalanceAdapter).eql(tokensToSend)
        expect(finalBalanceB).eql(tokensToSend)
    })
})
