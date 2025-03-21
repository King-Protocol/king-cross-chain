// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFTAdapterUpgradeable } from "layerzero-v2/oapp/contracts/oft/OFTAdapterUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { PairwiseRateLimiter } from "./PairwiseRateLimiter.sol";

contract KingOFTL1 is OFTAdapterUpgradeable, AccessControlUpgradeable, PausableUpgradeable, PairwiseRateLimiter {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");

    /**
     * @dev Constructor for KingOFTAdapterUpgradeable
     * @param _token The address of the already deployed weETH token
     * @param _lzEndpoint The LZ endpoint address
     */
    constructor(address _token, address _lzEndpoint) OFTAdapterUpgradeable(_token, _lzEndpoint) {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param _owner The contract owner
     * @param _delegate The LZ delegate
     */
    function initialize(address _owner, address _delegate) external initializer {
        __Ownable_init(_owner);
        __OFTAdapter_init(_delegate);

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
    }

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        _checkAndUpdateOutboundRateLimit(_dstEid, _amountLD);
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }

    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal virtual override whenNotPaused returns (uint256 amountReceivedLD) {
        _checkAndUpdateInboundRateLimit(_srcEid, _amountLD);
        return super._credit(_to, _amountLD, 0);
    }

    function setOutboundRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external onlyOwner {
        _setOutboundRateLimits(_rateLimitConfigs);
    }

    function setInboundRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external onlyOwner {
        _setInboundRateLimits(_rateLimitConfigs);
    }

    function pauseBridge() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpauseBridge() external onlyRole(UNPAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Overrides the role admin logic from AccessControlUpgradeable to restrict granting roles to the owner
     */
    function grantRole(bytes32 role, address account) public override onlyOwner {
        _grantRole(role, account);
    }

    /**
     * @dev Overrides the role admin logic from AccessControlUpgradeable to restrict revoking roles to the owner
     */
    function revokeRole(bytes32 role, address account) public override onlyOwner {
        _revokeRole(role, account);
    }

    uint256[50] private __gap;
}
