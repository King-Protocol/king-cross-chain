// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL2 } from "./KingOFTL2.sol";
import { Fee } from "./Fee.sol";


/**
 * @title KingOFTL2Payable
 * @dev This contract extends KingOFTL2 to support fee payments.
 * It allows setting a treasury address and managing fees for cross-chain transactions.
 */
contract KingOFTL2Payable is KingOFTL2, Fee {
    constructor(address _lzEndpoint) KingOFTL2(_lzEndpoint) {}

    /**
     * @dev Sets the treasury address where fees will be secured.
     * @param _treasury The address of the treasury.
     */
    function setTreasury(address _treasury) external onlyOwner {
        _setTreasury(_treasury);
    }

    /**
     * @dev Sets the default fee basis points (bps) for all destinations.
     * @param _bps The default fee in basis points.
     */
    function setDefaultFeeBps(uint16 _bps) external onlyOwner {
        _setDefaultFeeBps(_bps);
    }
    /**
     * @dev Sets the fee basis points (bps) for a specific destination.
     * @param _dstEid The destination endpoint ID.
     * @param _bps The fee in basis points.
     * @param _enabled Whether the fee is enabled or not.
     */
    function setFeeBps(uint32 _dstEid, uint16 _bps, bool _enabled) external onlyOwner {
        _setFeeBps(_dstEid, _bps, _enabled);
    }

    /**
     * @dev Performs a debit operation with fee deduction.
     * @param _amountLD The amount to debit in tokens.
     * @param _minAmountLD The minimum amount to debit in tokens.
     * @param _dstEid The destination endpoint ID.
     */
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
