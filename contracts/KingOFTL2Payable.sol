// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL2 } from "./KingOFTL2.sol";
import { IFee } from "./interfaces/IFee.sol";


// @dev WARNING: This is for testing purposes only
contract KingOFTL2Payable is KingOFTL2, IFee {
    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public defaultFeeBps;
    
    address public treasury;
    mapping(uint32 dstEid => FeeConfig config) public feeBps;

    constructor(address _lzEndpoint) KingOFTL2(_lzEndpoint) {}

    error TreasuryNotSet();
    error NullAddress();

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256, uint256) {
        _checkAndUpdateOutboundRateLimit(_dstEid, _amountLD);
        uint256 _fee = getFee(_dstEid, _amountLD);
        if (_fee > 0) {
            _amountLD -= _fee;
            transferFrom(msg.sender, treasury, _fee);
        }
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) {
            revert NullAddress();
        }
        treasury = _treasury;
    }

    /**
     * @dev Sets the default fee basis points (BPS) for all destinations.
     */
    function setDefaultFeeBps(uint16 _feeBps) external {
        if (treasury == address(0)) {
            revert TreasuryNotSet();
        }
        if (_feeBps > BPS_DENOMINATOR) revert IFee.InvalidBps();
        defaultFeeBps = _feeBps;
        emit DefaultFeeBpsSet(_feeBps);
    }

    /**
     * @dev Sets the fee basis points (BPS) for a specific destination LayerZero EndpointV2 ID.
     */
    function setFeeBps(uint32 _dstEid, uint16 _feeBps, bool _enabled) external {
        if (treasury == address(0)) {
            revert TreasuryNotSet();
        }
        if (_feeBps > BPS_DENOMINATOR) revert IFee.InvalidBps();
        feeBps[_dstEid] = FeeConfig(_feeBps, _enabled);
        emit FeeBpsSet(_dstEid, _feeBps, _enabled);
    }

    /**
     * @dev Returns the fee for a specific destination LayerZero EndpointV2 ID.
     */
    function getFee(uint32 _dstEid, uint256 _amount) public view virtual returns (uint256) {
        uint16 bps = _getFeeBps(_dstEid);
        return bps == 0 ? 0 : (_amount * bps) / BPS_DENOMINATOR;
    }

    function _getFeeBps(uint32 _dstEid) internal view returns (uint16) {
        FeeConfig memory config = feeBps[_dstEid];
        return config.enabled ? config.feeBps : defaultFeeBps;
    }
}
