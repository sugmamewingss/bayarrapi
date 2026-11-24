import { ethers, network } from "hardhat";

// Deploy: npm run deploy:sepolia
// Salin alamat yang tercetak ke apps/web/.env sebagai LEDGER_CONTRACT_ADDRESS.
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Jaringan : ${network.name}`);
  console.log(`Deployer : ${deployer.address}`);
  const ledger = await ethers.deployContract("BayarRapiLedger");
  await ledger.waitForDeployment();
  const address = await ledger.getAddress();
  console.log(`BayarRapiLedger: ${address}`);
  if (network.name === "sepolia") console.log(`Etherscan: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
