import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { serialize } from "borsh";

// Define the instruction types to match the Rust program
enum InstructionType {
  Increment = 0,
  Decrement = 1,
}

// Define the instruction data structure
class CounterInstruction {
  instruction: InstructionType;
  value: number;

  constructor(instruction: InstructionType, value: number) {
    this.instruction = instruction;
    this.value = value;
  }
}

// Borsh schema for serialization to match Rust InstructionType enum
const instructionSchema = new Map([
  [CounterInstruction, {
    kind: 'struct',
    fields: [
      ['instruction', 'u8'],
      ['value', 'u32']
    ]
  }]
]);

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const programId = new PublicKey("4ggoZHPRakfLmaVeUCMpKG3oUgqVvV5nRY5hgoJuByXt");
  
  const userKeypair = Keypair.generate();
  
  const counterAccount = Keypair.generate();
  
  console.log("Program ID:", programId.toBase58());
  console.log("User Keypair:", userKeypair.publicKey.toBase58());
  console.log("Counter Account:", counterAccount.publicKey.toBase58());
  
  try {
    // Airdrop SOL to user for transaction fees (devnet only)
    console.log("Requesting airdrop...");
    const airdropSignature = await connection.requestAirdrop(
      userKeypair.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
    console.log("Airdrop completed");

    // Create counter account
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: userKeypair.publicKey,
      newAccountPubkey: counterAccount.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(4), // 4 bytes for u32
      space: 4, // Size of Counter struct (u32)
      programId: programId,
    });

    const createTransaction = new Transaction().add(createAccountInstruction);
    await sendAndConfirmTransaction(connection, createTransaction, [userKeypair, counterAccount]);
    console.log("Counter account created");

    // Increment counter by 5
    // await incrementCounter(connection, programId, counterAccount.publicKey, userKeypair, 5);

    await readCounter(connection, counterAccount.publicKey);
    
    // Decrement counter by 2
    // await decrementCounter(connection, programId, counterAccount.publicKey, userKeypair, 2);
    
    // Read final counter value
    // await readCounter(connection, counterAccount.publicKey);

  } catch (error) {
    console.error("Error:", error);
  }
}

async function incrementCounter(
  connection: Connection,
  programId: PublicKey,
  counterAccount: PublicKey,
  payer: Keypair,
  value: number
) {
  const instruction = new CounterInstruction(InstructionType.Increment, value);
  const instructionData = serialize(instructionSchema, instruction);

  const transactionInstruction = new TransactionInstruction({
    keys: [
      { pubkey: counterAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: Buffer.from(instructionData),
  });

  const transaction = new Transaction().add(transactionInstruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  
  console.log(`Incremented counter by ${value}. Transaction: ${signature}`);
}

async function decrementCounter(
  connection: Connection,
  programId: PublicKey,
  counterAccount: PublicKey,
  payer: Keypair,
  value: number
) {
  const instruction = new CounterInstruction(InstructionType.Decrement, value);
  const instructionData = serialize(instructionSchema, instruction);

  const transactionInstruction = new TransactionInstruction({
    keys: [
      { pubkey: counterAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: Buffer.from(instructionData),
  });

  const transaction = new Transaction().add(transactionInstruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  
  console.log(`Decremented counter by ${value}. Transaction: ${signature}`);
}

async function readCounter(connection: Connection, counterAccount: PublicKey) {
  const accountInfo = await connection.getAccountInfo(counterAccount);
  
  if (accountInfo === null) {
    console.log("Counter account not found");
    return;
  }

  // Deserialize the counter data
  const data = accountInfo.data;
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = dataView.getUint32(0, true); // little-endian
  
  console.log(`Current counter value: ${count}`);
}

// Run the main function
main().catch(console.error);