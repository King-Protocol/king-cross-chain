import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import '@nomicfoundation/hardhat-chai-matchers'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig, HardhatRuntimeEnvironment, LinePreprocessorConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import './type-extensions'
import 'hardhat-preprocessor'

import fs from 'fs'

const MNEMONIC = process.env.MNEMONIC
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
        ? [PRIVATE_KEY]
        : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],

    },

    networks: {
        'mainnet': {
            chainId: 1,
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            url: process.env.RPC_URL_MAINNET || 'https://eth.drpc.org/',
            accounts,
            oftAdapter: {
                tokenAddress: '0x8F08B70456eb22f6109F57b8fafE862ED28E6040',
            },
            safeConfig: {
                safeUrl: 'https://safe-transaction-mainnet.safe.global/api/api/v1/',
                safeAddress: process.env.MAINNET_OWNER_ADDRESS || '',
            }
        },
        'swell': {
            chainId: 1923,
            eid: EndpointId.SWELL_V2_MAINNET,
            url: process.env.RPC_URL_SWELL || 'https://rpc.ankr.com/swell/',
            accounts,
            safeConfig: {
                safeUrl: '',
                safeAddress: process.env.SWELL_OWNER_ADDRESS || '',
            }
        },
        'arbitrum': {
            chainId: 42161,
            eid: EndpointId.ARBITRUM_V2_MAINNET,
            url: process.env.RPC_URL_ARBITRUM || 'https://arb1.drpc.org/',
            accounts,
            safeConfig: {
                safeUrl: 'https://safe-transaction-arbitrum.safe.global/api/api/v1',
                safeAddress: process.env.ARBITRUM_OWNER_ADDRESS || '',
            }
        },
        'base': {
            chainId: 8453,
            eid: EndpointId.BASE_V2_MAINNET,
            url: process.env.RPC_URL_BASE || 'https://rpc.ankr.com/8453/',
            accounts,
            safeConfig: {
                safeUrl: 'https://safe-transaction-base.safe.global/api/api/v1/',
                safeAddress: process.env.BASE_OWNER_ADDRESS || '',
            }
        },
        hardhat: {
            allowUnlimitedContractSize: true,
            blockGasLimit: 32000000
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}

export default config
