// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL1 } from "./KingOFTL1.sol";
import { KingOFTFee } from "./KingOFTFee.sol";

// @dev WARNING: This is for testing purposes only
contract KingOFTL1Payable is KingOFTL1, KingOFTFee {
    constructor(address _token, address _lzEndpoint) KingOFTL1(_token, _lzEndpoint) {}

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256, uint256) {
        uint256 _fee = getFee(_dstEid, _amountLD);
        if (_fee > 0) {
            _amountLD -= _fee;
            innerToken.transferFrom(msg.sender, treasury, _fee);
        }
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }
}
