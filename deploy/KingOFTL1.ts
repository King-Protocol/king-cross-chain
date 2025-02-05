import assert from 'assert'

import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'KingOFTL1'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    const expectedNetworkId = 1;
    if (hre.network.config.chainId !== expectedNetworkId) {
        console.error(`Invalid network ID: ${hre.network.config.chainId}. Expected: ${expectedNetworkId}`)
        return
    }

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    const endpointV2Deployment = await hre.deployments.get('EndpointV2')

    if (hre.network.config.oftAdapter == null) {
        console.warn(`oftAdapter not configured on network config, skipping OFTWrapper deployment`)

        return
    }

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            hre.network.config.oftAdapter.tokenAddress,
            endpointV2Deployment.address,
            deployer,
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deploy.tags = [contractName]

export default deploy
