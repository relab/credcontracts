// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Faculty.sol";

contract FacultyMock is Faculty {
    uint256 private _balance;

    constructor(address[] memory owners, uint8 quorum) Faculty(owners, quorum) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function addCourse(address course) public {
        addChild(course);
    }

    function setBalance() public payable {
        _balance += msg.value;
    }

    function getBalance() public view returns (uint256) {
        return _balance;
    }
}
