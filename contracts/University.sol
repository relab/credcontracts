// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Faculty.sol";
import "certree/contracts/node/Node.sol";

/**
 * @title University
 * This contract manage faculties contracts.
 */
contract University is Node {
    event FacultyAdded(address indexed createdBy, address indexed facultyAddress);

    constructor(address[] memory owners, uint8 quorum) Node(Role.Inner, owners, quorum) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function addFaculty(address faculty) public onlyOwner {
        require(!facultyExists(address(faculty)), "University/faculty already registered");
        addChild(address(faculty));
        assert(_isChild[address(faculty)]);
        emit FacultyAdded(msg.sender, address(faculty));
    }

    function facultyExists(address faculty) public view returns (bool) {
        return _isChild[faculty];
    }

    function faculties() public view returns (address[] memory) {
        return _children;
    }
}
