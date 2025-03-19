import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'


const mainnetContract: OmniPointHardhat = {
    eid: EndpointId.ETHEREUM_V2_MAINNET,
    contractName: 'KingOFTL1',
}
const swellContract: OmniPointHardhat = {
    eid: EndpointId.SWELL_V2_MAINNET,
    contractName: 'KingOFTL2',
}
const arbitrumContract: OmniPointHardhat = {
    eid: EndpointId.ARBITRUM_V2_MAINNET,
    contractName: 'KingOFTL2',
}
const baseContract: OmniPointHardhat = {
    eid: EndpointId.BASE_V2_MAINNET,
    contractName: 'KingOFTL2',
}

const ALL_CONTRACTS = [
    mainnetContract,
    swellContract,
    arbitrumContract,
    baseContract,
]


function makeEnforcedOptions() {
    return [
        {
            msgType: 1,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: 75000,
            value: 0,
        },
        {
            msgType: 1,
            optionType: ExecutorOptionType.NATIVE_DROP,
            amount: 0,
            receiver: "0x0000000000000000000000000000000000000000",
        },
        {
            msgType: 2,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: 75000,
            value: 0,
        },
        {
            msgType: 2,
            optionType: ExecutorOptionType.COMPOSE,
            index: 0,
            gas: 75000,
            value: 0,
        },
    ]
}

function makeReceiveLib(lib: string) {
    return {
        receiveLibraryConfig: {
            receiveLibrary: lib,
            gracePeriod: BigInt(0),
        },
        receiveLibraryTimeoutConfig: {
            lib,
            expiry: BigInt(0),
        },
    }
}

function makeULNConfig(requiredDVNs: string[], optionalDVNs: string[]) {
    return {
        confirmations: BigInt(0),
        requiredDVNs,
        optionalDVNs,
        optionalDVNThreshold: 1,
    }
}

function makeExecutorConfig(executor: string) {
    return {
        maxMessageSize: 10000,
        executor,
    }
}

const MAINNET_OUTBOUND = {
  sendLibrary:   "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1",
  executor:      "0x173272739Bd7Aa6e4e214714048a9fE699453059",
  requiredDVNs:  ["0x589dedbd617e0cbcb916a9223f4d1300c294236b"], // LZ
  optionalDVNs:  [
    "0x380275805876ff19055ea900cdb2b46a94ecf20d", // Horizon
    "0xa59ba433ac34d2927232918ef5b2eaafcf130ba5", // Nethermind
  ],
  receiveLib:    "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
}

const SWELL_OUTBOUND = {
  sendLibrary:   "0xc1B621b18187F74c8F6D52a6F709Dd2780C09821",
  executor:      "0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e",
  requiredDVNs:  ["0x6788f52439aca6bff597d3eec2dc9a44b8fee842"], // LZ
  optionalDVNs:  [
    "0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b", // Nethermind
    "0xf4672690ef45b46eaa3b688fe2f0fc09e9366b20", // Horizon
  ],
  receiveLib:    "0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6",
}

const ARBITRUM_OUTBOUND = {
  sendLibrary:   "0x5cDc927876031B4Ef910735225c425A7Fc8efed9",
  executor:      "0x31CAe3B7fB82d847621859fb1585353c5720660D",
  requiredDVNs:  ["0x2f55c492897526677c5b68fb199ea31e2c126416"], // LZ
  optionalDVNs:  [
    "0xa7b5189bca84cd304d8553977c7c614329750d99", // Nethermind
    "0x19670df5e16bea2ba9b9e68b48c054c5baea06b8", // Horizon
  ],
  receiveLib:    "0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6",
}

const BASE_OUTBOUND = {
  sendLibrary:   "0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2",
  executor:      "0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4",
  requiredDVNs:  ["0x9e059a54699a285714207b43b055483e78faac25"], // LZ
  optionalDVNs:  [
    "0xcd37ca043f8479064e10635020c65ffc005d36f6", // Nethermind
    "0xa7b5189bca84cd304d8553977c7c614329750d99", // Horizon
  ],
  receiveLib:    "0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf",
}


type ChainConfig = {
  sendLibrary: string
  executor: string
  requiredDVNs: string[]
  optionalDVNs: string[]
  receiveLib: string
}

const PARTIALS: Record<number, Record<number, ChainConfig>> = {
  [EndpointId.ETHEREUM_V2_MAINNET]: {
    [EndpointId.SWELL_V2_MAINNET]:    MAINNET_OUTBOUND,
    [EndpointId.ARBITRUM_V2_MAINNET]: MAINNET_OUTBOUND,
    [EndpointId.BASE_V2_MAINNET]:     MAINNET_OUTBOUND,
  },
  [EndpointId.SWELL_V2_MAINNET]: {
    [EndpointId.ETHEREUM_V2_MAINNET]: SWELL_OUTBOUND,
    [EndpointId.ARBITRUM_V2_MAINNET]: SWELL_OUTBOUND,
    [EndpointId.BASE_V2_MAINNET]:     SWELL_OUTBOUND,
  },
  [EndpointId.ARBITRUM_V2_MAINNET]: {
    [EndpointId.ETHEREUM_V2_MAINNET]: ARBITRUM_OUTBOUND,
    [EndpointId.SWELL_V2_MAINNET]:    ARBITRUM_OUTBOUND,
    [EndpointId.BASE_V2_MAINNET]:     ARBITRUM_OUTBOUND,
  },
  [EndpointId.BASE_V2_MAINNET]: {
    [EndpointId.ETHEREUM_V2_MAINNET]: BASE_OUTBOUND,
    [EndpointId.SWELL_V2_MAINNET]:    BASE_OUTBOUND,
    [EndpointId.ARBITRUM_V2_MAINNET]: BASE_OUTBOUND,
  },
}

function buildConnection(
  from: OmniPointHardhat,
  to:   OmniPointHardhat,
) {
  const partial = PARTIALS[from.eid]?.[to.eid]
  if (!partial) return undefined

  return {
    from,
    to,
    config: {
      sendLibrary: partial.sendLibrary,
      ...makeReceiveLib(partial.receiveLib),
      sendConfig: {
        executorConfig: makeExecutorConfig(partial.executor),
        ulnConfig: makeULNConfig(partial.requiredDVNs, partial.optionalDVNs),
      },
      receiveConfig: {
        ulnConfig: makeULNConfig(partial.requiredDVNs, partial.optionalDVNs),
      },
      enforcedOptions: makeEnforcedOptions(),
    },
  }
}

const allPairs: [OmniPointHardhat, OmniPointHardhat][] = [
  [mainnetContract, swellContract],
  [mainnetContract, arbitrumContract],
  [mainnetContract, baseContract],

  [swellContract, mainnetContract],
  [swellContract, arbitrumContract],
  [swellContract, baseContract],

  [arbitrumContract, mainnetContract],
  [arbitrumContract, swellContract],
  [arbitrumContract, baseContract],

  [baseContract, mainnetContract],
  [baseContract, swellContract],
  [baseContract, arbitrumContract],
]

const connections = allPairs
  .map(([f, t]) => buildConnection(f, t))
  .filter(Boolean)

const config: OAppOmniGraphHardhat = {
  contracts: ALL_CONTRACTS.map(contract => ({ contract })),
  connections: connections as any,
}

export default config
