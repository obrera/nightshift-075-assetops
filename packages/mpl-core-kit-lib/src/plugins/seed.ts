import type { Address } from '@solana/addresses'
import type { ReadonlyUint8Array } from '@solana/codecs'

import type { BaseSeed } from '../generated/index.ts'
import type { RenameToType } from '../utils.ts'

export type Seed =
  | {
      bytes: ReadonlyUint8Array
      type: 'Bytes'
    }
  | {
      pubkey: Address
      type: 'Address'
    }
  | Exclude<RenameToType<BaseSeed>, { type: 'Address' } | { type: 'Bytes' }>

export function seedFromBase(s: BaseSeed): Seed {
  if (s.__kind === 'Address') {
    return {
      pubkey: s.fields[0],
      type: 'Address',
    }
  }
  if (s.__kind === 'Bytes') {
    return {
      bytes: s.fields[0],
      type: 'Bytes',
    }
  }
  return {
    type: s.__kind,
  }
}

export function seedToBase(s: Seed): BaseSeed {
  if (s.type === 'Address') {
    return {
      __kind: 'Address',
      fields: [s.pubkey],
    }
  }

  if (s.type === 'Bytes') {
    return {
      __kind: 'Bytes',
      fields: [s.bytes],
    }
  }
  return {
    __kind: s.type,
  }
}
