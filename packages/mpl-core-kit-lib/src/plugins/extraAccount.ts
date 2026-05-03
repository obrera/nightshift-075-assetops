import type { Address } from '@solana/addresses'

import type { BaseExtraAccount } from '../generated/index.ts'
import { type RenameToType, someOrNone, unwrapOption } from '../utils.ts'
import { type Seed, seedFromBase, seedToBase } from './seed.ts'

export const PRECONFIGURED_SEED = 'mpl-core'

export type ExtraAccount =
  | {
      address: Address
      isSigner?: boolean
      isWritable?: boolean
      type: 'Address'
    }
  | {
      customProgramId?: Address
      isSigner?: boolean
      isWritable?: boolean
      seeds: Array<Seed>
      type: 'CustomPda'
    }
  | ({
      isSigner?: boolean
      isWritable?: boolean
    } & Omit<
      Exclude<RenameToType<BaseExtraAccount>, { type: 'Address' } | { type: 'CustomPda' }>,
      'isSigner' | 'isWritable'
    >)

export type ExtraAccountInput = 'asset' | 'collection' | 'owner' | 'program' | 'recipient'

export function extraAccountFromBase(s: BaseExtraAccount): ExtraAccount {
  if (s.__kind === 'CustomPda') {
    return {
      customProgramId: unwrapOption(s.customProgramId),
      isSigner: s.isSigner,
      isWritable: s.isWritable,
      seeds: s.seeds.map(seedFromBase),
      type: 'CustomPda',
    }
  }
  if (s.__kind === 'Address') {
    return {
      address: s.address,
      isSigner: s.isSigner,
      isWritable: s.isWritable,
      type: 'Address',
    }
  }

  return {
    isSigner: s.isSigner,
    isWritable: s.isWritable,
    type: s.__kind,
  }
}

export function extraAccountToBase(s: ExtraAccount): BaseExtraAccount {
  const accountMeta: Pick<BaseExtraAccount, 'isSigner' | 'isWritable'> = {
    isSigner: s.isSigner || false,
    isWritable: s.isWritable || false,
  }
  if (s.type === 'CustomPda') {
    return {
      __kind: 'CustomPda',
      ...accountMeta,
      customProgramId: someOrNone(s.customProgramId),
      seeds: s.seeds.map(seedToBase),
    }
  }
  if (s.type === 'Address') {
    return {
      __kind: 'Address',
      ...accountMeta,
      address: s.address,
    }
  }

  return {
    __kind: s.type,
    ...accountMeta,
  }
}

const EXTRA_ACCOUNT_INPUT_MAP: {
  [type in ExtraAccount['type']]?: ExtraAccountInput
} = {
  PreconfiguredAsset: 'asset',
  PreconfiguredCollection: 'collection',
  PreconfiguredOwner: 'owner',
  PreconfiguredProgram: 'program',
  PreconfiguredRecipient: 'recipient',
}

export function getExtraAccountRequiredInputs(s: ExtraAccount): ExtraAccountInput[] {
  const preconfigured = EXTRA_ACCOUNT_INPUT_MAP[s.type]
  if (preconfigured) {
    return [preconfigured]
  }

  if (s.type === 'CustomPda') {
    return s.seeds
      .map((seed) => {
        switch (seed.type) {
          case 'Asset':
            return 'asset'
          case 'Collection':
            return 'collection'
          case 'Owner':
            return 'owner'
          case 'Recipient':
            return 'recipient'
          default:
            return null
        }
      })
      .filter((input) => input) as ExtraAccountInput[]
  }

  return []
}
