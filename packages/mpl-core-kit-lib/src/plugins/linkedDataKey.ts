import type { Address } from '@solana/addresses'

import type { BaseLinkedDataKey } from '../generated/index.ts'
import { type PluginAuthority, pluginAuthorityFromBase, pluginAuthorityToBase } from './pluginAuthority.ts'

export type LinkedDataKey =
  | {
      dataAuthority: PluginAuthority
      type: 'LinkedAppData'
    }
  | {
      hookedProgram: Address
      type: 'LinkedLifecycleHook'
    }

export function linkedDataKeyFromBase(e: BaseLinkedDataKey): LinkedDataKey {
  switch (e.__kind) {
    case 'LinkedAppData':
      return {
        dataAuthority: pluginAuthorityFromBase(e.fields[0]),
        type: e.__kind,
      }
    case 'LinkedLifecycleHook':
      return {
        hookedProgram: e.fields[0],
        type: e.__kind,
      }
    default:
      throw new Error('Unknown LinkedDataKey type')
  }
}

export function linkedDataKeyToBase(e: LinkedDataKey): BaseLinkedDataKey {
  switch (e.type) {
    case 'LinkedAppData':
      return {
        __kind: e.type,
        fields: [pluginAuthorityToBase(e.dataAuthority)],
      }
    case 'LinkedLifecycleHook':
      return {
        __kind: e.type,
        fields: [e.hookedProgram],
      }
    default:
      throw new Error('Unknown LinkedDataKey type')
  }
}
