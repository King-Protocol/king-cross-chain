// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IFee } from "./interfaces/IFee.sol";

abstract contract KingOFTFee is IFee {
    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_FEE_BPS = 500; // 5% maximum fee
    uint16 public defaultFeeBps;
    
    address public treasury;
    mapping(uint32 dstEid => FeeConfig config) public feeBps;

    error TreasuryNotSet();
    error NullAddress();
    error FeeTooHigh();

    event TreasurySet(address indexed oldTreasury, address indexed newTreasury);

    function setTreasury(address _treasury) external virtual {
        if (_treasury == address(0)) {
            revert NullAddress();
        }
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasurySet(oldTreasury, _treasury);
    }

    /**
     * @dev Sets the default fee basis points (BPS) for all destinations.
     */
    function setDefaultFeeBps(uint16 _feeBps) external virtual {
        if (treasury == address(0)) {
            revert TreasuryNotSet();
        }
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        defaultFeeBps = _feeBps;
        emit DefaultFeeBpsSet(_feeBps);
    }

    /**
     * @dev Sets the fee basis points (BPS) for a specific destination LayerZero EndpointV2 ID.
     */
    function setFeeBps(uint32 _dstEid, uint16 _feeBps, bool _enabled) external virtual {
        if (treasury == address(0)) {
            revert TreasuryNotSet();
        }
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
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