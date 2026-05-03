import type { Address } from '@solana/addresses'

import type { BasePluginAuthority } from '../generated/index.ts'

export type PluginAuthority = {
  address?: Address
  type: PluginAuthorityType
}

export type PluginAuthorityType = BasePluginAuthority['__kind']

export function comparePluginAuthorities(a: PluginAuthority, b: PluginAuthority): boolean {
  if (a.type !== b.type) {
    return false
  }

  return a.address === b.address
}

export function pluginAuthority(type: 'None' | 'Owner' | 'UpdateAuthority'): PluginAuthority
export function pluginAuthority(type: 'Address', options: { address: Address }): PluginAuthority
export function pluginAuthority(type: PluginAuthorityType, options?: { address: Address }): PluginAuthority {
  return {
    address: options?.address,
    type,
  }
}
export function pluginAuthorityFromBase(authority: BasePluginAuthority): PluginAuthority {
  return {
    address: (authority as { address?: Address }).address,
    type: authority.__kind,
  }
}
export function pluginAuthorityToBase(u: PluginAuthority): BasePluginAuthority {
  if (u.type === 'Address') {
    return {
      __kind: 'Address',
      address: u.address as Address,
    }
  }
  return {
    __kind: u.type,
  }
}
