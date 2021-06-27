// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Course.sol";
import "certree/contracts/node/Node.sol";

/**
 * @title Academic Faculty
 */
contract Faculty is Node {
    mapping(bytes32 => address[]) internal _coursesBySemester;

    event SemesterRegistered(address registar, bytes32 semester);

    event CourseAdded(address indexed createdBy, address indexed courseAddress, bytes32 indexed semester);

    constructor(address[] memory owners, uint8 quorum) Node(Role.Inner, owners, quorum) {
        // solhint-disable-previous-line no-empty-blocks
    }

    modifier registeredSemester(bytes32 semester) {
        require(semesterExists(semester), "Faculty/semester not registered");
        _;
    }

    function registerSemester(bytes32 semester, address[] memory newCourses) public onlyOwner {
        // TODO: limit the number of courses
        require(!semesterExists(semester), "Faculty/already registered");
        require(newCourses.length > 0, "Faculty/empty courses list");
        for (uint256 i = 0; i < newCourses.length; i++) {
            assert(!courseExists(newCourses[i]));
        }
        _coursesBySemester[semester] = newCourses;
        emit SemesterRegistered(msg.sender, semester);
    }

    function addCourse(bytes32 semester, address course) public onlyOwner {
        require(!courseExists(address(course)), "Faculty/course already registered");
        addChild(address(course));
        assert(_isChild[address(course)]);

        _coursesBySemester[semester].push(address(course));
        emit CourseAdded(msg.sender, address(course), semester);
    }

    function semesterExists(bytes32 semester) public view returns (bool) {
        return _coursesBySemester[semester].length != 0;
    }

    function courseExists(address course) public view returns (bool) {
        return _isChild[course];
    }

    function getCoursesBySemester(bytes32 semester)
        public
        view
        registeredSemester(semester)
        returns (address[] memory)
    {
        return _coursesBySemester[semester];
    }

    function courses() public view returns (address[] memory) {
        return _children;
    }

    // FIXME: node should be a library or only contain internal methods.
    // Library is preferred to safe some gas.
    // NOTE: As the current `registerCredential` is public and not internal,
    // this function can be by-passed by calling registerCredential directly.
    function registerSemesterCredential(
        bytes32 semester,
        address student,
        bytes32 digest,
        address[] memory witnesses
    ) public onlyOwner registeredSemester(semester) {
        super.registerCredential(student, digest, witnesses);
    }

}
