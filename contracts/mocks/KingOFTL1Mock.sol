// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL1 } from "../KingOFTL1.sol";

// @dev WARNING: This is for testing purposes only
contract KingOFTL1Mock is KingOFTL1 {
    constructor(address _token, address _lzEndpoint, address _delegate) KingOFTL1(_token, _lzEndpoint) {}
}
