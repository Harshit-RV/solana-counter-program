use borsh:: {
    BorshDeserialize,
    BorshSerialize
};

use solana_program::{
    account_info::{next_account_info, AccountInfo}, 
    entrypoint::{entrypoint, ProgramResult},
    msg,
    pubkey::Pubkey,
};

#[derive(Debug, BorshSerialize, BorshDeserialize)]
enum InstructionType {
    Increment(u32),
    Decrement(u32)
}

#[derive(Debug, BorshSerialize, BorshDeserialize)]
struct Counter {
    count: u32
}

entrypoint!(counter_contract);

pub fn counter_contract(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let acc = next_account_info(&mut accounts.iter())?; 
    let instruction = InstructionType::try_from_slice(instruction_data)?;
    let mut current_data = Counter::try_from_slice(&acc.data.borrow())?;

    match instruction {
        InstructionType::Increment(value) => {
            current_data.count += 1;
        }
        InstructionType::Decrement(value) => {
            current_data.count -= 1;
        }
    } 
    current_data.serialize(&mut *acc.data.borrow_mut())?;

    msg!("Updated Counter of {} to {:?}", acc.key, current_data);
    Ok(())
}