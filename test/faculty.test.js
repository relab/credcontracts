const { BN, expectEvent, time, expectRevert, ether } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const Faculty = artifacts.require("FacultyMock");
const Course = artifacts.require("CourseMock");

async function createFinishedCourses (sender, faculty, semester, numberOfCourses, numberOfExams, teachers, student) {
    const coursesAddress = [];
    const certs = [];
    for (let i = 0; i < numberOfCourses; i++) {
        // Create the course
        await faculty.createCourse(semester, teachers, 2, { from: sender });
        // Start the course
        await time.increase(time.duration.seconds(1));
        // Get the course instance
        const course = await Course.at(await faculty.getCourseBySemester(semester, i));
        coursesAddress.push(course.address);
        // Add student
        await course.addStudent(student, { from: teachers[0] });
        // Add exam certificates
        for (let j = 0; j < numberOfExams; j++) {
            const examDigest = web3.utils.keccak256(web3.utils.toHex(`course${i}-exam${j}`));
            // issue exams certificate
            for (const teacher of teachers) {
                await course.registerCredential(student, examDigest, { from: teacher });
            }
            await course.approveCredential(examDigest, { from: student });
            await time.increase(time.duration.seconds(1));
        }

        // Add course certificate
        const courseDigest = web3.utils.keccak256(web3.utils.toHex(`course${i}`));
        for (const teacher of teachers) {
            await course.registerCredential(student, courseDigest, { from: teacher });
        }
        await course.approveCredential(courseDigest, { from: student });
        await time.increase(time.duration.seconds(1));

        certs.push(await course.digestsBySubject(student));
    }
    // await time.increase(time.duration.hours(1));

    for (const cAddress of coursesAddress) {
        const course = await Course.at(cAddress);
        await course.aggregateCredentials(student, { from: teachers[0] });
    }

    return { coursesAddress, certs };
}

function createDiploma (certs, diploma) {
    // Aggregate courses certs
    const aggregatedCerts = certs.map(c => web3.utils.keccak256(web3.eth.abi.encodeParameter("bytes32[]", c)));

    // Create new root
    aggregatedCerts.push(diploma); // (course aggregations + diploma)
    const root = web3.utils.keccak256(web3.eth.abi.encodeParameter("bytes32[]", aggregatedCerts));

    return { proofs: aggregatedCerts, root };
}

// TODO: update faculty tests
contract.skip("Faculty", accounts => {
    const [dean, adm, teacher, evaluator, student, other] = accounts;
    let faculty = null;
    const semester = web3.utils.keccak256(web3.utils.toHex("spring2020"));
    const diplomaDigest = web3.utils.keccak256(web3.utils.toHex("diploma"));

    describe("constructor", () => {
        it("should successfully deploy the contract", async () => {
            faculty = await Faculty.new([dean, adm], 2);
            (await faculty.isOwner(dean)).should.equal(true);
            (await faculty.isOwner(adm)).should.equal(true);
            expect(await faculty.quorum()).to.be.bignumber.equal(new BN(2));
        });
    });

    describe("course creation", () => {
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            faculty.setBalance({ value: ether("1") });
        });

        it("should not create a course from a unauthorized address", async () => {
            await expectRevert(
                faculty.createCourse(semester, [teacher, evaluator], 2, { from: other }),
                "Owners: sender is not an owner"
            );
        });

        it("should retrieve a course by semester", async () => {
            const course = await Course.new([teacher, evaluator], 2, { from: adm });
            await faculty.addCourse(course.address, semester);

            (await faculty.coursesBySemester(semester, 0)).should.equal(course.address);
        });

        it("should create a course", async () => {
            const { logs } = await faculty.createCourse(semester, [teacher, evaluator], 2, { from: adm });

            expectEvent.inLogs(logs, "CourseCreated", {
                createdBy: adm,
                semester: semester,
                courseAddress: await faculty.coursesBySemester(semester, 0),
                quorum: new BN(2)
            });
        });

        it("course should be an issuer instance", async () => {
            await faculty.createCourse(semester, [teacher, evaluator], 2, { from: adm });

            const courseAddress = await faculty.coursesBySemester(semester, 0);
            (await faculty.isIssuer(courseAddress)).should.equal(true);
        });
    });

    describe("issuing diploma", () => {
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            faculty.setBalance({ value: ether("1") });
        });

        it("should issue a diploma", async () => {
            const { coursesAddress, certs } = await createFinishedCourses(adm, faculty, semester, 2, 2, [teacher, evaluator], student);

            // Aggregate courses certs
            const expectedCerts = certs.map(c => web3.utils.keccak256(web3.eth.abi.encodeParameter("bytes32[]", c)));

            // Add new diploma to expected certs
            expectedCerts.push(diplomaDigest);

            // issue a diploma
            // FIXME: As reported in the bug: https://github.com/trufflesuite/truffle/issues/2868
            // The following is the workaround for the hidden overloaded method:
            await faculty.methods["registerCredential(address,bytes32,address[])"](student, diplomaDigest, coursesAddress, { from: adm });

            const diploma = (await faculty.digestsBySubject(student))[0];
            (diploma).should.equal(diplomaDigest);
        });
    });

    describe("verifying diploma", () => {
        let coursesAddress; let certs;
        let root = null;
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            ({ coursesAddress, certs } = await createFinishedCourses(adm, faculty, semester, 2, 2, [teacher, evaluator], student));
            ({ root } = createDiploma(certs, diplomaDigest));
        });

        it("should successfully verify a valid diploma", async () => {
            await faculty.methods["registerCredential(address,bytes32,address[])"](student, diplomaDigest, coursesAddress, { from: adm });

            (await faculty.verifyCredentialTree(student, root)).should.equal(true);
        });
    });
});
