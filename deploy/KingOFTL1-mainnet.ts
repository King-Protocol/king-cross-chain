import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assert from 'assert';
import dotenv from 'dotenv';

dotenv.config();

const owner = process.env.MAINNET_OWNER_ADDRESS;

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, ethers, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');
    assert(owner, 'Missing owner account');

    const expectedNetworkId = 1;
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

    const endpointV2Deployment = await deployments.get('EndpointV2');

    const L1ImplDeployment = await deploy('KingOFTL1', {
        from: deployer,
        args: [
            network.config.oftAdapter.tokenAddress,
            endpointV2Deployment.address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    const L1ImplAddress = L1ImplDeployment.address;
    log(`KingOFTL1implementation deployed at ${L1ImplAddress}`);

    const UUPSDeployment = await deploy('UUPS', {
        from: deployer,
        args: [
            L1ImplAddress,
            deployer,
            "0x",
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    const l1ProxyAddress = UUPSDeployment.address;
    log(`UUPS proxy deployed at ${l1ProxyAddress}`);

    const kingOFTL1 = await ethers.getContractAt('KingOFTL1', l1ProxyAddress);

    const initTx = await kingOFTL1.initialize(deployer, deployer);
    await initTx.wait();

    log(
        `Deployment complete: KingOFTL1 proxy is deployed at ${l1ProxyAddress} on network ${network.name}`
    );
};

deploy.tags = ['mainnet'];
export default deploy;
