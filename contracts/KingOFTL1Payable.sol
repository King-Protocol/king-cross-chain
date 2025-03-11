// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL1 } from "./KingOFTL1.sol";

// @dev WARNING: This is for testing purposes only
contract KingOFTL1Payable is KingOFTL1 {
    uint256 public fee;
    address public treasury;

    constructor(address _token, address _lzEndpoint) KingOFTL1(_token, _lzEndpoint) {}

    error TreasuryNotSet();
    error NullAddress();

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256, uint256) {
        _checkAndUpdateOutboundRateLimit(_dstEid, _amountLD);
        uint256 _fee = (_amountLD * fee) / 10000;
        if (fee > 0) {
            _amountLD -= _fee;
            innerToken.transferFrom(msg.sender, treasury, _fee);
        }
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }

    function setFee(uint256 _fee) external onlyOwner {
        if (treasury == address(0)) {
            revert TreasuryNotSet();
        }
        fee = _fee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) {
            revert NullAddress();
        }
        treasury = _treasury;
    }
}
