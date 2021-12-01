const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;
let owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy(); 
    [owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2] = await ethers.getSigners();
});

describe("Add workers", async function() {
    it("Maker amount should be 0 initially", async function() {
        const amount = await contractInstance.makersAmount();
        expect(0).to.be.equal(amount);
    });

    it("Maker amount should be 1 after adding a new one", async function() {
        const makerName = "Maker 1"; 
        const makerCountry = "UY";
        const makerPassport = "123";

        await contractInstance.addMaker(maker1.address, makerName, makerCountry, makerPassport);

        const amount = await contractInstance.makersAmount();
        expect(1).to.be.equal(amount);
    });
    
    it("Maker role should be stored successfully", async function() {
        const makerName = "Maker 1"; 
        const makerCountry = "UY";
        const makerPassport = "123";

        await contractInstance.addMaker(maker1.address, makerName, makerCountry, makerPassport);

        const role = await contractInstance.userRoles(maker1.address);
        expect(2).to.be.equal(role);
    });

	it("Maker attributes should be stored successfully", async function() {
        const makerName = "Maker 1"; 
        const makerCountry = "UY";
        const makerPassport = "123";

        await contractInstance.addMaker(maker1.address, makerName, makerCountry, makerPassport);

        const attributes = await contractInstance.makersAttributes(maker1.address);
        expect(makerName).to.be.equal(attributes.name);
        expect(makerCountry).to.be.equal(attributes.country);
        expect(makerPassport).to.be.equal(attributes.passport);
    });

    it("Auditors amount should be 0 initially", async function() {
        const amount = await contractInstance.auditorsAmount();
        expect(0).to.be.equal(amount);
    });

    it("Auditors amount should be 1 after adding a new one", async function() {
        await contractInstance.addAuditor(auditor1.address);

        const amount = await contractInstance.auditorsAmount();
        expect(1).to.be.equal(amount);
    });

    it("Auditor role should be stored successfully", async function() {
        await contractInstance.addAuditor(auditor1.address);

        const role = await contractInstance.userRoles(auditor1.address);
        expect(3).to.be.equal(role);
    });
});

describe("Open Submission Period", async function() {
    it("Open submission period without authorization should be reverted", async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await expect(contractInstance.connect(maker1).openSubmissionPeriod()).to.be.revertedWith('Not authorized');
        await expect(contractInstance.connect(auditor1).openSubmissionPeriod()).to.be.revertedWith('Not authorized');
    });
    
    it("Open submission period without enough makers should be reverted", async function() {
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await expect(contractInstance.openSubmissionPeriod()).to.be.revertedWith('Not enough makers');
    });

    it("Open submission period without enough auditors should be reverted", async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await expect(contractInstance.openSubmissionPeriod()).to.be.revertedWith('Not enough auditors');
    });

    it("Open submission period with enough workers should be successful", async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        expect(1).to.be.equal(await contractInstance.actualPeriod());
    });
});