// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL1 } from "./KingOFTL1.sol";
import { Fee }       from "./Fee.sol";

contract KingOFTL1Payable is KingOFTL1, Fee {
    constructor(address _token, address _lzEndpoint)
        KingOFTL1(_token, _lzEndpoint)
    {}

    function setTreasury(address _treasury) external onlyOwner {
        _setTreasury(_treasury);
    }

    function setDefaultFeeBps(uint16 _bps) external onlyOwner {
        _setDefaultFeeBps(_bps);
    }

    function setFeeBps(uint32 _dstEid, uint16 _bps, bool _enabled) external onlyOwner {
        _setFeeBps(_dstEid, _bps, _enabled);
    }

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32  _dstEid
    )
        internal
        override
        returns (uint256, uint256)
    {
        uint256 fee = getFee(_dstEid, _amountLD);
        if (fee > 0) {
            _amountLD -= fee;
            innerToken.transferFrom(msg.sender, treasury, fee);
        }
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }
}
