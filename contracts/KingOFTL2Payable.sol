// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL2 } from "./KingOFTL2.sol";
import { KingOFTFee } from "./KingOFTFee.sol";

// @dev WARNING: This is for testing purposes only
contract KingOFTL2Payable is KingOFTL2, KingOFTFee {
    constructor(address _lzEndpoint) KingOFTL2(_lzEndpoint) {}

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256, uint256) {
        uint256 _fee = getFee(_dstEid, _amountLD);
        if (_fee > 0) {
            _amountLD -= _fee;
            _transfer(msg.sender, treasury, _fee);
        }
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }
}
