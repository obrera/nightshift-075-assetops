import type { Address } from '@solana/addresses'

import type { BaseUpdateAuthority } from '../generated/index.ts'

export type UpdateAuthority = {
  address?: Address
  type: UpdateAuthorityType
}

export type UpdateAuthorityType = BaseUpdateAuthority['__kind']

export function updateAuthority(type: 'None'): UpdateAuthority
export function updateAuthority(type: 'Address' | 'Collection', address: Address): UpdateAuthority
export function updateAuthority(type: UpdateAuthorityType, address?: Address): UpdateAuthority {
  return {
    address,
    type,
  }
}
export function updateAuthorityFromBase(authority: BaseUpdateAuthority): UpdateAuthority {
  return {
    address: authority.__kind === 'None' ? undefined : (authority as { fields: readonly [Address] }).fields[0],
    type: authority.__kind,
  }
}
export function updateAuthorityToBase(u: UpdateAuthority): BaseUpdateAuthority {
  if (u.type === 'None') {
    return {
      __kind: 'None',
    }
  }
  return {
    __kind: u.type,
    fields: [u.address as Address],
  }
}
