import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import assert from 'assert'
import dotenv from 'dotenv'

dotenv.config()

const existingProxyAddress = "0xc2606AADe4bdd978a4fa5a6edb3b66657acEe6F8";
const adminProxyAddress = "0x18C6d75FB422f7B28bC8c1EdDea88C11d4d7C2E1";

const upgrade: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, ethers, network, getNamedAccounts } = hre
  const { log } = deployments
  const { deployer } = await getNamedAccounts()

  assert(deployer, 'Missing named deployer account')

  const expectedNetworkId = 1923
  log(`Network: ${network.name}`)
  log(`Deployer: ${deployer}`)

  if (network.config.chainId !== expectedNetworkId) {
    console.error(
      `Invalid network ID: ${network.config.chainId}. Expected: ${expectedNetworkId}`
    )
    return
  }

  const endpointV2Deployment = await deployments.get('EndpointV2')

  const KingOFTL2PayableFactory = await ethers.getContractFactory('KingOFTL2Payable')
  const newImpl = await KingOFTL2PayableFactory.deploy(endpointV2Deployment.address)
  await newImpl.deployed()
  log(`New KingOFTL2Payable implementation deployed at: ${newImpl.address}`)
  const adminProxy = await ethers.getContractAt('ProxyAdmin', adminProxyAddress)
  const upgradeData = "0x"
  const tx = await adminProxy.upgradeToAndCall(existingProxyAddress, newImpl.address, upgradeData)
  await tx.wait()
  log(`L2 proxy at ${existingProxyAddress} upgraded to new implementation at ${newImpl.address}`)
}

upgrade.tags = ['upgrade']
export default upgrade
