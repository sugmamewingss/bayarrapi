import { expect } from "chai";
import { ethers } from "hardhat";

const id = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

describe("BayarRapiLedger", () => {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const ledger = await ethers.deployContract("BayarRapiLedger");
    await ledger.waitForDeployment();
    return { ledger, owner, other };
  }

  const batchId = id("BR-20261125-TEST01");
  const recipientsHash = id("daftar-penerima");
  const proofHash = id("RAPI-ABCD-EFGH");

  it("mencatat batch dan memancarkan event", async () => {
    const { ledger } = await deploy();
    await expect(ledger.recordBatch(batchId, recipientsHash, 925000, 3))
      .to.emit(ledger, "BatchRecorded")
      .withArgs(batchId, recipientsHash, 925000, 3);
    const b = await ledger.getBatch(batchId);
    expect(b.exists).to.equal(true);
    expect(b.totalAmount).to.equal(925000n);
    expect(b.recipientCount).to.equal(3n);
  });

  it("menolak batch yang dicatat dua kali (idempotensi on-chain)", async () => {
    const { ledger } = await deploy();
    await ledger.recordBatch(batchId, recipientsHash, 925000, 3);
    await expect(ledger.recordBatch(batchId, recipientsHash, 925000, 3)).to.be.revertedWithCustomError(
      ledger,
      "BatchAlreadyRecorded",
    );
  });

  it("menolak batch tidak valid", async () => {
    const { ledger } = await deploy();
    await expect(ledger.recordBatch(batchId, ethers.ZeroHash, 925000, 3)).to.be.revertedWithCustomError(ledger, "InvalidBatch");
    await expect(ledger.recordBatch(batchId, recipientsHash, 0, 3)).to.be.revertedWithCustomError(ledger, "InvalidBatch");
  });

  it("hanya operator yang boleh menulis", async () => {
    const { ledger, other } = await deploy();
    await expect(ledger.connect(other).recordBatch(batchId, recipientsHash, 925000, 3)).to.be.revertedWithCustomError(
      ledger,
      "NotOperator",
    );
  });

  it("mencatat bukti pencairan untuk batch yang sudah ada", async () => {
    const { ledger } = await deploy();
    await ledger.recordBatch(batchId, recipientsHash, 925000, 3);
    await expect(ledger.recordPayout(batchId, proofHash, 1)).to.emit(ledger, "PayoutRecorded").withArgs(batchId, proofHash, 1);
    const p = await ledger.getPayout(proofHash);
    expect(p.exists).to.equal(true);
    expect(p.batchId).to.equal(batchId);
    expect(p.status).to.equal(1n);
  });

  it("menolak payout untuk batch yang tidak ada, status salah, atau dicatat dua kali", async () => {
    const { ledger } = await deploy();
    await expect(ledger.recordPayout(batchId, proofHash, 1)).to.be.revertedWithCustomError(ledger, "BatchNotFound");
    await ledger.recordBatch(batchId, recipientsHash, 925000, 3);
    await expect(ledger.recordPayout(batchId, proofHash, 3)).to.be.revertedWithCustomError(ledger, "InvalidStatus");
    await ledger.recordPayout(batchId, proofHash, 2);
    await expect(ledger.recordPayout(batchId, proofHash, 1)).to.be.revertedWithCustomError(ledger, "PayoutAlreadyRecorded");
  });

  it("owner bisa mengganti operator, selain owner tidak bisa", async () => {
    const { ledger, other } = await deploy();
    await expect(ledger.connect(other).setOperator(other.address)).to.be.revertedWithCustomError(ledger, "NotOwner");
    await ledger.setOperator(other.address);
    expect(await ledger.operator()).to.equal(other.address);
    await expect(ledger.connect(other).recordBatch(batchId, recipientsHash, 925000, 3)).to.emit(ledger, "BatchRecorded");
  });
});
