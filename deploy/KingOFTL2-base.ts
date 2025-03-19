import assert from 'assert'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import dotenv from 'dotenv'

dotenv.config()

const owner = process.env.SWELL_OWNER_ADDRESS
const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, ethers, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')
    assert(owner, 'Missing owner account');

    const expectedNetworkId = 8453;

    console.log(`Network: ${network.name}`)
    console.log(`Deployer: ${deployer}`)

    if (network.config.chainId !== expectedNetworkId) {
        console.error(
            `Invalid network ID: ${network.config.chainId}. Expected: ${expectedNetworkId}`
        )
        return
    }

    const endpointV2Deployment = await deployments.get('EndpointV2')

    if (hre.network.config.oftAdapter != null) {
        console.warn(
            `oftAdapter configuration found on network config, skipping L2 deployment`
        )
        return
    }

    const l2ImplDeployment = await deploy('KingOFTL2', {
        from: deployer,
        args: [
            endpointV2Deployment.address,
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })
    const l2ImplAddress = l2ImplDeployment.address
    console.log(`KingOFTL2 implementation deployed at: ${l2ImplAddress}`)

    const proxyDeployment = await deploy('UUPS', {
        from: deployer,
        args: [
            l2ImplAddress,
            deployer,
            "0x",
        ],
        log: true,
        
        skipIfAlreadyDeployed: false,
    })
    const l2ProxyAddress = proxyDeployment.address
    console.log(`UUPS proxy deployed at: ${l2ProxyAddress}`)

    const kingOFTL2 = await ethers.getContractAt('KingOFTL2', l2ProxyAddress)
    const initTx = await kingOFTL2.initialize("King Protocol", "KING", deployer)
    await initTx.wait()
    
    log(
        `Deployment complete: KingOFTL2 proxy is deployed at ${l2ProxyAddress} on network ${network.name}`
    );
}

deploy.tags = ['base']
export default deploy
