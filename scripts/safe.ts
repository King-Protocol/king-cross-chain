import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

const gnosisSafeAbi = [
  "function nonce() public view returns (uint256)",
  "function execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes) external payable returns (bool success)",
  "function getThreshold() public view returns (uint256)"
];

interface TxItem {
  destination: string;
  calldata: string;
  description?: string;
}

interface SafeTx {
  to: string;
  value: number;
  data: string;
  operation: number;
  safeTxGas: number;
  baseGas: number;
  gasPrice: number;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
}

async function main() {
  const jsonStr = readFileSync(join(__dirname, "data.json"), "utf8");
  const txArray: TxItem[] = JSON.parse(jsonStr);
  const [signer] = await ethers.getSigners();
  
  const safeAddress = process.env.SWELL_OWNER_ADDRESS || "";
  if (!safeAddress) {
    throw new Error("Safe address not found in environment variables");
  }
  
  console.log("Using signer address:", await signer.getAddress());
  console.log("Safe address:", safeAddress);
  
  const safeContract = new Contract(safeAddress, gnosisSafeAbi, signer);
  
  const threshold = await safeContract.getThreshold();
  console.log(`Safe threshold: ${threshold.toString()}`);
  
  if (threshold.toNumber() > 1) {
    console.warn("WARNING: This Safe requires multiple signatures but this script only provides one");
  }
  
  for (let i = 0; i < txArray.length; i++) {
    const { destination, calldata, description } = txArray[i];
    console.log("\n========== Transaction #" + (i + 1) + " ==========");
    if (description) console.log("Description: " + description);
    console.log("Destination: " + destination);
    console.log("Calldata: " + calldata);
    
    const currentNonce: BigNumber = await safeContract.nonce();
    console.log("Current Safe nonce:", currentNonce.toString());
    
    const chainId = (await signer.provider!.getNetwork()).chainId;
    const domain = { chainId, verifyingContract: safeAddress };
    
    const types = {
      SafeTx: [
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "safeTxGas" },
        { type: "uint256", name: "baseGas" },
        { type: "uint256", name: "gasPrice" },
        { type: "address", name: "gasToken" },
        { type: "address", name: "refundReceiver" },
        { type: "uint256", name: "nonce" }
      ]
    };
    const gasPrice = await signer.getGasPrice();
    const baseGas = 21000;
    const refundReceiver = await signer.getAddress();

    let message: SafeTx = {
      to: destination,
      value: 0,
      data: calldata,
      operation: 0,
      safeTxGas: 0,
      baseGas,
      gasPrice: gasPrice.toNumber(),
      gasToken: ethers.constants.AddressZero,
      refundReceiver,
      nonce: currentNonce.toNumber()
    };
    
    const signatureObject = await signer._signTypedData(domain, types, message);
    const { r, s, v } = ethers.utils.splitSignature(signatureObject);
    
    const signatureBytes = ethers.utils.solidityPack(
      ['bytes'],
      [ethers.utils.hexConcat([
        ethers.utils.hexZeroPad(r, 32),
        ethers.utils.hexZeroPad(s, 32),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(v), 1)
      ])]
    );
    
    const estimatedSafeTxGas = await safeContract.estimateGas.execTransaction(
      message.to,
      message.value,
      message.data,
      message.operation,
      0,
      baseGas,
      gasPrice,
      message.gasToken,
      message.refundReceiver,
      signatureBytes
    );
    
    message = {
      ...message,
      safeTxGas: estimatedSafeTxGas.toNumber()
    };
    
    
    try {
      const txResponse = await safeContract.execTransaction(
        message.to,
        message.value,
        message.data,
        message.operation,
        message.safeTxGas,
        message.baseGas,
        message.gasPrice,
        message.gasToken,
        message.refundReceiver,
        signatureBytes,
        { gasLimit: 3_000_000 }
      );
      
      console.log("Submitted tx: " + txResponse.hash);
      const receipt = await txResponse.wait();
      console.log("Mined block=" + receipt.blockNumber + ", status=" + receipt.status);
    } catch (error) {
      console.error("Transaction execution failed:", error);
      
      if (error.data) {
        console.error("Error data:", error.data);
      }
      
      console.log("Continuing with next transaction...");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });