// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {OFTUpgradeable} from "layerzero-v2/oapp/contracts/oft/OFTUpgradeable.sol";
import {IMintableERC20} from "./interfaces/IMintableERC20.sol";
import {PairwiseRateLimiter} from "./PairwiseRateLimiter.sol";

/**
 * @title KingOFTL2
 * @dev This contract extends OFTUpgradeable to support pausing and rate limiting functionality. 
 */
contract KingOFTL2 is OFTUpgradeable, AccessControlUpgradeable, PausableUpgradeable, PairwiseRateLimiter, IMintableERC20 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");

    /**
     * @dev Constructor for MintableOFT
     * @param endpoint The layer zero endpoint address
     */
    constructor(address endpoint) OFTUpgradeable(endpoint) {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param owner The owner of the token
     */
    function initialize(string memory name, string memory symbol, address owner) external virtual initializer {
        __OFT_init(name, symbol, owner);
        __Ownable_init(owner);

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
    }

    /**
     * @dev Performs a debit operation with rate limiting.
     * @param _amountLD The amount to debit in tokens.
     * @param _minAmountLD The minimum amount to debit in tokens.
     * @param _dstEid The destination endpoint ID.
     */
    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused() returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        _checkAndUpdateOutboundRateLimit(_dstEid, _amountLD);
        return super._debit(_amountLD, _minAmountLD, _dstEid);
    }

    /**
     * @dev Performs a credit operation with rate limiting.
     * @param _to The address to credit the tokens to.
     * @param _amountLD The amount to credit in tokens.
     * @param _srcEid The source endpoint ID.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal virtual override whenNotPaused() returns (uint256 amountReceivedLD) {
        _checkAndUpdateInboundRateLimit(_srcEid, _amountLD);
        return super._credit(_to, _amountLD, 0);
    }

    /**
     * @notice Mint function that can only be called by a minter
     * @dev Used by the SyncPool contract in the native minting flow
     * @param _account The account to mint the tokens to
     * @param _amount The amount of tokens to mint
     */
    function mint(address _account, uint256 _amount) external onlyRole(MINTER_ROLE) {
        _mint(_account, _amount);
    }
    
    /**
     * @notice Sets the outbound rate limits for the bridge
     * @param _rateLimitConfigs  An array of RateLimitConfig structs defining the rate limits for each destination endpoint
     */
    function setOutboundRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external onlyOwner() {
        _setOutboundRateLimits(_rateLimitConfigs);
    }

    /**
     * @notice Sets the inbound rate limits for the bridge
     * @param _rateLimitConfigs  An array of RateLimitConfig structs defining the rate limits for each source endpoint
     */
    function setInboundRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external onlyOwner() {
        _setInboundRateLimits(_rateLimitConfigs);
    }

    /**
     * @notice Pauses the bridge functionality
     * @dev This function can only be called by an account with the PAUSER_ROLE
     */
    function pauseBridge() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the bridge functionality
     * @dev This function can only be called by an account with the UNPAUSER_ROLE
     */
    function unpauseBridge() external onlyRole(UNPAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Overrides the role admin logic from AccessControlUpgradeable to restrict granting roles to the owner
     */
    function grantRole(bytes32 role, address account) public override onlyOwner() {
        _grantRole(role, account);
    }

    /**
     * @dev Overrides the role admin logic from AccessControlUpgradeable to restrict revoking roles to the owner
     */
    function revokeRole(bytes32 role, address account) public override onlyOwner() {
        _revokeRole(role, account);
    }

    function updateTokenSymbol(string memory name_, string memory symbol_) external onlyOwner() {
        ERC20Storage storage $ = getERC20Storage();
        $._name = name_;
        $._symbol = symbol_;
    }

    function getERC20Storage() internal pure returns (ERC20Storage storage $) {
        bytes32 ERC20StorageLocation = 0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00;
        assembly {
            $.slot := ERC20StorageLocation
        }
    }

    uint256[50] private __gap;
}
