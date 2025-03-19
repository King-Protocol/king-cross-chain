import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assert from 'assert';
import dotenv from 'dotenv';
import { EndpointId } from '@layerzerolabs/lz-definitions';
const kingOFTL1Address = require('../deployment/mainnet/KingOFT1.json').address;

dotenv.config();

const owner = process.env.MAINNET_OWNER_ADDRESS;

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, ethers, network } = hre;
    const { log } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');
    assert(owner, 'Missing owner account');

    const expectedNetworkId = 1;
    const peerNetworkEIds = [EndpointId.ARBITRUM_V2_MAINNET, EndpointId.SWELL_V2_MAINNET, EndpointId.BASE_V2_MAINNET];

    log(`Network: ${network.name}`);
    log(`Deployer: ${deployer}`);

    if (network.config.chainId !== expectedNetworkId) {
        console.error(
            `Invalid network ID: ${network.config.chainId}. Expected: ${expectedNetworkId}`
        );
        return;
    }

    if (!network.config.oftAdapter || !network.config.oftAdapter.tokenAddress) {
        console.warn(
            `oftAdapter not configured on network config, skipping KingOFTL1 deployment`
        );
        return;
    }

    const signer = await ethers.getSigner(deployer);
    if (!signer) {
        throw new Error('Deployer signer not found');
    }

    const kingOFTL1 = await ethers.getContractAt('KingOFTL1', kingOFTL1Address, signer);
    const rateLimits = peerNetworkEIds.map((peerNetworkEId) => [peerNetworkEId, ethers.utils.parseEther('100000'), 1]);
    
    for (const rateLimit of rateLimits) {
        await kingOFTL1.connect(signer).setInboundRateLimits(rateLimit);
        await kingOFTL1.connect(signer).setOutboundRateLimits(rateLimit);
    }

    await kingOFTL1.connect(signer).setDelegate(owner);
    await kingOFTL1.connect(signer).transferOwnership(owner);
    
};

deploy.tags = ['rates-mainnet'];
export default deploy;
