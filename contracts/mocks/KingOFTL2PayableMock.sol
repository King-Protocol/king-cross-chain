// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { KingOFTL2Mock } from "./KingOFTL2Mock.sol";
import { StorageSlot } from "@openzeppelin/contracts/utils/StorageSlot.sol";

// @dev WARNING: This is for testing purposes only
contract KingOFTL2PayableMock is KingOFTL2Mock {
    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    uint256 public fee;
    address public treasury;

    constructor(address _lzEndpoint) KingOFTL2Mock(_lzEndpoint) {}

    error TreasuryNotSet();
    error NullAddress();

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256, uint256) {
        uint256 _fee = (_amountLD * fee) / 10000;
        if (fee > 0) {
            _amountLD -= _fee;
            transferFrom(msg.sender, treasury, _fee);
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

    function setAdmin(address _admin) external onlyOwner {
        StorageSlot.getAddressSlot(ADMIN_SLOT).value = _admin;
    }
}
