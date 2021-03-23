const { BN, expectEvent, time, expectRevert, ether, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Faculty = artifacts.require('FacultyMock');
const Course = artifacts.require('CourseMock');
const Owners = artifacts.require('Owners');

async function createFinishedCourses(sender, faculty, semester, numberOfCourses, numberOfExams, teachers, student) {
    let coursesAddress = [];
    var certs = [];
    for (i = 0; i < numberOfCourses; i++) {
        // Create the course
        await faculty.createCourse(semester, teachers, 2, { from: sender });
        // Start the course
        await time.increase(time.duration.seconds(1));
        // Get the course instance
        //FIXME: does not work
        let course = await Course.at(await faculty.getCourseBySemester(semester, i));
        coursesAddress.push(course.address);

        // Add student
        await course.addStudent(student, { from: teachers[0] });
        // Add exam certificates
        for (j = 0; j < numberOfExams; j++) {
            let examDigest = web3.utils.keccak256(web3.utils.toHex(`course${i}-exam${j}`));
            // issue exams certificate
            for (let teacher of teachers) {
                await course.registerCredential(student, examDigest, { from: teacher });
            }
            await course.approveCredential(examDigest, { from: student });
            await time.increase(time.duration.seconds(1));
        }

        // Add course certificate
        let courseDigest = web3.utils.keccak256(web3.utils.toHex(`course${i}`));
        for (let teacher of teachers) {
            await course.registerCredential(student, courseDigest, { from: teacher });
        }
        await course.approveCredential(courseDigest, { from: student });
        await time.increase(time.duration.seconds(1));

        certs.push(await course.digestsBySubject(student));
    }
    // await time.increase(time.duration.hours(1));

    for (let cAddress of coursesAddress) {
        let course = await Course.at(cAddress);
        await course.aggregateCredentials(student, { from: teachers[0] });
    }

    return { coursesAddress, certs }
}

function createDiploma(certs, diploma) {
    // Aggregate courses certs
    var aggregatedCerts = certs.map(c => web3.utils.keccak256(web3.eth.abi.encodeParameter('bytes32[]', c)));

    // Create new root
    aggregatedCerts.push(diploma) //(course aggregations + diploma)
    let root = web3.utils.keccak256(web3.eth.abi.encodeParameter('bytes32[]', aggregatedCerts));

    return { proofs: aggregatedCerts, root }
}

async function showBalance(account, address) {
    console.log("ETH Balance of ", account, " : ", (await balance.current(address, 'wei')).toString());
}

// TODO: update faculty tests
contract.skip('Faculty', accounts => {
    const [dean, adm, teacher, evaluator, student, other] = accounts;
    let faculty = null;
    const semester = web3.utils.keccak256(web3.utils.toHex('spring2020'));
    const diplomaDigest = web3.utils.keccak256(web3.utils.toHex('diploma'));

    async function showAllBalances() {
        await showBalance("Faculty Contract", faculty.address);
        await showBalance("Dean", dean);
        await showBalance("Adm", adm);
        await showBalance("Teacher", teacher);
        await showBalance("Evaluator", evaluator);
        await showBalance("Student", student);
    }

    describe('constructor', () => {
        it('should successfully deploy the contract', async () => {
            faculty = await Faculty.new([dean, adm], 2);
            (await faculty.isOwner(dean)).should.equal(true);
            (await faculty.isOwner(adm)).should.equal(true);
            expect(await faculty.quorum()).to.be.bignumber.equal(new BN(2));
        });
    });

    describe('course creation', () => {
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            faculty.setBalance({ value: ether('1') });
        });

        it('should not create a course from a unauthorized address', async () => {
            await expectRevert(
                faculty.createCourse(semester, [teacher, evaluator], 2, { from: other }),
                'Owners: sender is not an owner'
            );
        });

        it('should retrieve a course by semester', async () => {
            let course = await Course.new([teacher, evaluator], 2, { from: adm });
            await faculty.addCourse(course.address, semester);

            (await faculty.coursesBySemester(semester, 0)).should.equal(course.address);
        });

        it('should create a course', async () => {
            const { logs } = await faculty.createCourse(semester, [teacher, evaluator], 2, { from: adm });

            expectEvent.inLogs(logs, 'CourseCreated', {
                createdBy: adm,
                semester: semester,
                courseAddress: await faculty.coursesBySemester(semester, 0),
                quorum: new BN(2)
            });
        });

        // TODO: check this
        it('course should be an issuer instance', async () => {
            await faculty.createCourse(semester, [teacher, evaluator], 2, { from: adm });

            let courseAddress = await faculty.coursesBySemester(semester, 0);
            (await faculty.isIssuer(courseAddress)).should.equal(true);
        });
    });

    describe('issuing diploma', () => {
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            faculty.setBalance({ value: ether('1') });
        });

        it('should issue a diploma', async () => {
            let { coursesAddress, certs } = await createFinishedCourses(adm, faculty, semester, 2, 2, [teacher, evaluator], student);

            // Aggregate courses certs
            var expectedCerts = certs.map(c => web3.utils.keccak256(web3.eth.abi.encodeParameter('bytes32[]', c)));

            // Add new diploma to expected certs
            expectedCerts.push(diplomaDigest);

            // Create new root
            let expectedRoot = web3.utils.keccak256(web3.eth.abi.encodeParameter('bytes32[]', expectedCerts));

            // Finish courses
            // await time.increase(time.duration.hours(1));

            // issue a diploma
            // FIXME: As reported in the bug: https://github.com/trufflesuite/truffle/issues/2868
            // The following is the workaround for the hidden overloaded method:
            await faculty.methods["registerCredential(address,bytes32,address[])"](student, diplomaDigest, coursesAddress, { from: adm });

            let diploma = (await faculty.digestsBySubject(student))[0];
            (diploma).should.equal(diplomaDigest);
        });
    });

    describe('verifying diploma', () => {
        let coursesAddress, certs, proofs = [];
        let root = null;
        beforeEach(async () => {
            faculty = await Faculty.new([dean, adm], 2);
            ({ coursesAddress, certs } = await createFinishedCourses(adm, faculty, semester, 2, 2, [teacher, evaluator], student));
            ({ proofs, root } = createDiploma(certs, diplomaDigest));
            console.log(coursesAddress);
            console.log(certs);
            console.log(proofs);
            console.log(root);
        });

        it('should successfully verify a valid diploma', async () => {
            await faculty.methods["registerCredential(address,bytes32,address[])"](student, diplomaDigest, coursesAddress, { from: adm });

            let rootProof = await faculty.getProof(student);
            console.log("ROOT: ", rootProof);

            (await faculty.verifyCredentialTree(student, root)).should.equal(true);
        });

        // it('should revert if there is no sufficient number of issuers', async () => {
        //     await expectRevert(
        //         faculty.verifyCredentialTree(student, proofs, []),
        //         'AccountableIssuer: require at least one issuer'
        //     );
        // });

        // it('should revert if given issuer isn\'t a valid address', async () => {
        //     await expectRevert(
        //         faculty.verifyCredentialTree(student, proofs, ["0x0000NOT0A0ADDRESS000000"]),
        //         'invalid address'
        //     );
        // });

        // it('should revert if given issuer isn\'t authorized', async () => {
        //     let course = await Course.new([other], 1);
        //     await expectRevert(
        //         faculty.verifyCredentialTree(student, proofs, [course.address]),
        //         'AccountableIssuer: address not registered'
        //     );
        // });

        // it('should revert if given contract isn\'t an issuer instance', async () => {
        //     let something = await Owners.new([other], 1);
        //     await faculty.addIssuer(something.address); // force addition of wrong contract
        //     await expectRevert.unspecified(
        //         faculty.verifyCredentialTree(student, proofs, [something.address])
        //     );
        // });

        // it('should revert if there is no proof on sub-contracts', async () => {
        //     let course = await Course.new([teacher], 1);
        //     await faculty.addIssuer(course.address);
        //     await expectRevert(
        //         faculty.verifyCredentialTree(student, proofs, [course.address]),
        //         'Issuer: proof doesn\'t match or not exists'
        //     );
        // });

        // it('should revert if the proofs don\'t match', async () => {
        //     await faculty.methods["registerCredential(address,bytes32,address[])"](student, diplomaDigest, coursesAddress, { from: adm });

        //     let fakeCerts = []
        //     for (let i = 0; i < 3; i++) {
        //         fakeCerts[i] = web3.utils.keccak256(web3.utils.toHex(`someValue-${i}`));
        //     }

        //     await expectRevert(
        //         faculty.verifyCredentialTree(student, fakeCerts, coursesAddress),
        //         'Issuer: proof doesn\'t match or not exists'
        //     );
        // });
    });
});