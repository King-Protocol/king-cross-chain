import { EndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const mainnetContract: OmniPointHardhat = {
    eid: EndpointId.ETHEREUM_MAINNET,
    contractName: 'KingOFTL1',
}

const swellContract: OmniPointHardhat = {
    eid: EndpointId.SWELL_MAINNET,
    contractName: 'KingOFTL2',
}

const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: mainnetContract,
        },
        {
            contract: swellContract,
        },
    ],
    connections: [
        {
            from: mainnetContract,
            to: swellContract,
        },
        {
            from: swellContract,
            to: mainnetContract,
        },
    ],
}

export default config
