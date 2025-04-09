import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

const gnosisSafeAbi = [
  "function nonce() public view returns (uint256)",
  "function execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes) external payable returns (bool success)"
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
  const safeContract = new Contract(safeAddress, gnosisSafeAbi, signer);

  for (let i = 0; i < txArray.length; i++) {
    const { destination, calldata, description } = txArray[i];

    console.log("\n========== Transaction #" + (i + 1) + " ==========");
    if (description) console.log("Description: " + description);
    console.log("Destination: " + destination);
    console.log("Calldata:   " + calldata);

    const currentNonce: BigNumber = await safeContract.nonce();
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

    const message: SafeTx = {
      to: destination,
      value: 0,
      data: calldata,
      operation: 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce: currentNonce.toNumber()
    };

    const signatureFull = await signer._signTypedData(domain, types, message);
    const packedSignature = ethers.utils.joinSignature(signatureFull);


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
      packedSignature,
      { gasLimit: 3_000_000 }
    );

    console.log("Submitted tx: " + txResponse.hash);
    const receipt = await txResponse.wait();
    console.log("Mined block=" + receipt.blockNumber + ", status=" + receipt.status);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
