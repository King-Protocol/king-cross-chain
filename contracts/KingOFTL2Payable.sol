// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL2 } from "./KingOFTL2.sol";
import { Fee } from "./Fee.sol";


contract KingOFTL2Payable is KingOFTL2, Fee {
    constructor(address _lzEndpoint) KingOFTL2(_lzEndpoint) {}

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
