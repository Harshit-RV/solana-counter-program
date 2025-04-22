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

entrypoint!(counter_contract);

pub fn counter_contract(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Ok(())
}