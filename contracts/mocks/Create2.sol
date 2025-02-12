// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Create2Factory {
    event Deployed(address addr, bytes32 salt);

    /**
     * Deploy a contract using CREATE2.
     * @param bytecode The contract bytecode + constructor arguments
     * @param salt A salt (32 bytes). The same salt + bytecode yields the same deployment address
     */
    function deploy(bytes memory bytecode, bytes32 salt) external returns (address) {
        address addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit Deployed(addr, salt);
        return addr;
    }
}
