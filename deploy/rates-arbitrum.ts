import assert from 'assert'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import dotenv from 'dotenv'
import { EndpointId } from '@layerzerolabs/lz-definitions'
const kingOFTL2Address = require('../deployment/base/KingOFT1.json').address;
dotenv.config()

const owner = process.env.ARBITRUM_OWNER_ADDRESS
const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, ethers, network } = hre
    const { deployer } = await getNamedAccounts()
    const { log } = deployments;
    assert(deployer, 'Missing named deployer account')
    assert(owner, 'Missing owner account');

    const expectedNetworkId = 42161;
    const peerNetworkEIds = [EndpointId.ETHEREUM_V2_MAINNET, EndpointId.SWELL_V2_MAINNET, EndpointId.BASE_V2_MAINNET];
    log(`Network: ${network.name}`)
    log(`Deployer: ${deployer}`)

    if (network.config.chainId !== expectedNetworkId) {
        console.error(
            `Invalid network ID: ${network.config.chainId}. Expected: ${expectedNetworkId}`
        )
        return
    }

    if (hre.network.config.oftAdapter != null) {
        console.warn(
            `oftAdapter configuration found on network config, skipping L2 deployment`
        )
        return
    }

    const kingOFTL2 = await ethers.getContractAt('KingOFTL2', kingOFTL2Address);


    const signer = await ethers.getSigner(deployer)
    if (!signer) {
        throw new Error('Deployer signer not found');
    }
    // const rateLimit = [[peerNetworkEId, ethers.utils.parseEther('100000'), 1]];
    const rateLimits = peerNetworkEIds.map((peerNetworkEId) => [peerNetworkEId, ethers.utils.parseEther('100000'), 1]);
    
    for (const rateLimit of rateLimits) {
        await kingOFTL2.connect(signer).setInboundRateLimits(rateLimit);
        await kingOFTL2.connect(signer).setOutboundRateLimits(rateLimit);
    }
    await kingOFTL2.connect(signer).setDelegate(owner);
    await kingOFTL2.connect(signer).transferOwnership(owner);
};

deploy.tags = ['rates-arbitrum']
export default deploy
