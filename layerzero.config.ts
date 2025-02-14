import { EndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const mainnetContract: OmniPointHardhat = {
    eid: EndpointId.ETHEREUM_V2_MAINNET,
    contractName: 'KingOFTL1',
}

const swellContract: OmniPointHardhat = {
    eid: EndpointId.SWELL_V2_MAINNET,
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
            config: {
                sendLibrary: "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1",
                receiveLibraryConfig: {
                    receiveLibrary: "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
                    gracePeriod: BigInt(0),
                },
                receiveLibraryTimeoutConfig: {
                    lib: "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
                    expiry: BigInt(0),
                },
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: "0x173272739Bd7Aa6e4e214714048a9fE699453059",
                    },
                    ulnConfig: {
                        confirmations: BigInt(0),
                        requiredDVNs: ["0x589dedbd617e0cbcb916a9223f4d1300c294236b"],
                        optionalDVNs: [
                            "0x380275805876ff19055ea900cdb2b46a94ecf20d",
                            "0xa59ba433ac34d2927232918ef5b2eaafcf130ba5",
                        ],
                        optionalDVNThreshold: 1,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: BigInt(0),
                        requiredDVNs:  ["0x589dedbd617e0cbcb916a9223f4d1300c294236b"],
                        optionalDVNs: [
                            "0x380275805876ff19055ea900cdb2b46a94ecf20d",
                            "0xa59ba433ac34d2927232918ef5b2eaafcf130ba5",
                        ],
                        optionalDVNThreshold: 1,
                    },
                },
            }
        },
        {
            from: swellContract,
            to: mainnetContract,
            config: {
                sendLibrary: "0xc1B621b18187F74c8F6D52a6F709Dd2780C09821",
                receiveLibraryConfig: {
                    receiveLibrary: "0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6",
                    gracePeriod: BigInt(0),
                },
                receiveLibraryTimeoutConfig: {
                    lib: "0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6",
                    expiry: BigInt(0),
                },
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: "0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e",
                    },
                    ulnConfig: {
                        confirmations: BigInt(0),
                        requiredDVNs: ["0x6788f52439aca6bff597d3eec2dc9a44b8fee842"],
                        optionalDVNs: [
                            "0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b",
                            "0xf4672690ef45b46eaa3b688fe2f0fc09e9366b20"
                        ],
                        optionalDVNThreshold: 1,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: BigInt(0),
                        requiredDVNs: ["0x6788f52439aca6bff597d3eec2dc9a44b8fee842"],
                        optionalDVNs: [
                            "0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b",
                            "0xf4672690ef45b46eaa3b688fe2f0fc09e9366b20"
                        ],
                        optionalDVNThreshold: 1,
                    },
                },
                
            }
        },
    ],
}

export default config
