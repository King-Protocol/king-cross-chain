import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assert from 'assert';
import dotenv from 'dotenv';
import { EndpointId } from '@layerzerolabs/lz-definitions';

dotenv.config();

const existingProxyAddress = "0x4c8A4521F2431b0aC003829ac4e6dBC4Ed97707d";
const adminProxyAddress = "0x4b70e85217DB7cA09843e81604EF88E15c20177F";
const TREASURY = process.env.TREASURY_MAINNET_ADDRESS;

const upgrade: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, network, getNamedAccounts } = hre;
    const { log } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');


    const expectedNetworkId = 1;
    log(`Network: ${network.name}`);
    log(`Deployer: ${deployer}`);

    if (network.config.chainId !== expectedNetworkId) {
        console.error(
            `Invalid network ID: ${network.config.chainId}. Expected: ${expectedNetworkId}`
        );
        return;
    }

    const endpointV2Deployment = await deployments.get('EndpointV2');

    const KingOFTL1PayableFactory = await ethers.getContractFactory('KingOFTL1Payable');
    const tokenAddress = network.config.oftAdapter!.tokenAddress;
    const newImpl = await KingOFTL1PayableFactory.deploy(tokenAddress, endpointV2Deployment.address);
    await newImpl.deployed();
    log(`New KingOFTL1Payable implementation deployed at ${newImpl.address}`);
    const upgradeData = "0x";
    const adminProxy = await ethers.getContractAt('ProxyAdmin', adminProxyAddress);
    const tx = await adminProxy.upgradeToAndCall(existingProxyAddress, newImpl.address, upgradeData);
    await tx.wait();
    // const upgradedContract = await ethers.getContractAt('KingOFTL1Payable', existingProxyAddress);
    // await upgradedContract.setTreasury(TREASURY);
    // await upgradedContract.setDefaultFeeBps(100);
    // await upgradedContract.setFeeBps(EndpointId.SWELL_V2_MAINNET, 1000, true);

    log(`Proxy at ${existingProxyAddress} upgraded to new implementation at ${newImpl.address}`);
};

upgrade.tags = ['upgrade'];
export default upgrade;
