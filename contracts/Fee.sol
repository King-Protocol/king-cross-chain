// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IFee } from "./interfaces/IFee.sol";

abstract contract Fee is IFee {
    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_FEE_BPS     = 500;

    uint16  public defaultFeeBps;
    address public treasury;
    mapping(uint32 dstEid => FeeConfig cfg) public feeBps;

    function getFee(uint32 _dstEid, uint256 _amount) public view returns (uint256) {
        uint16 bps = _getFeeBps(_dstEid);
        return bps == 0 ? 0 : (_amount * bps) / BPS_DENOMINATOR;
    }

    function _setTreasury(address _treasury) internal {
        if (_treasury == address(0)) revert NullAddress();
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function _setDefaultFeeBps(uint16 _bps) internal {
        if (treasury == address(0)) revert TreasuryNotSet();
        if (_bps > MAX_FEE_BPS) revert IFee.InvalidBps();
        defaultFeeBps = _bps;
        emit DefaultFeeBpsSet(_bps);
    }

    function _setFeeBps(uint32 _dstEid, uint16 _bps, bool _enabled) internal {
        if (treasury == address(0)) revert TreasuryNotSet();
        if (_bps > MAX_FEE_BPS) revert IFee.InvalidBps();
        feeBps[_dstEid] = FeeConfig(_bps, _enabled);
        emit FeeBpsSet(_dstEid, _bps, _enabled);
    }

    function _getFeeBps(uint32 _dstEid) internal view returns (uint16) {
        FeeConfig memory cfg = feeBps[_dstEid];
        return cfg.enabled ? cfg.feeBps : defaultFeeBps;
    }
}
