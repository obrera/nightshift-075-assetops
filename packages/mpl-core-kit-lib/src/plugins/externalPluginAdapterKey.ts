import type { Address } from '@solana/addresses'

import type { BaseExternalPluginAdapterKey } from '../generated/index.ts'
import { type LinkedDataKey, linkedDataKeyToBase } from './linkedDataKey.ts'
import { type PluginAuthority, pluginAuthorityToBase } from './pluginAuthority.ts'

export type ExternalPluginAdapterKey =
  | {
      baseAddress: Address
      type: 'Oracle'
    }
  | {
      dataAuthority: PluginAuthority
      type: 'AppData'
    }
  | {
      dataAuthority: PluginAuthority
      type: 'LinkedAppData'
    }
  | {
      hookedProgram: Address
      type: 'LifecycleHook'
    }
  | {
      hookedProgram: Address
      type: 'LinkedLifecycleHook'
    }
  | { parentKey: LinkedDataKey; type: 'DataSection' }

export function externalPluginAdapterKeyToBase(e: ExternalPluginAdapterKey): BaseExternalPluginAdapterKey {
  switch (e.type) {
    case 'AppData':
    case 'LinkedAppData':
      return {
        __kind: e.type,
        fields: [pluginAuthorityToBase(e.dataAuthority)],
      }
    case 'DataSection':
      return {
        __kind: e.type,
        fields: [linkedDataKeyToBase(e.parentKey)],
      }
    case 'LifecycleHook':
      return {
        __kind: e.type,
        fields: [e.hookedProgram],
      }
    case 'LinkedLifecycleHook':
      return {
        __kind: e.type,
        fields: [e.hookedProgram],
      }
    case 'Oracle':
      return {
        __kind: e.type,
        fields: [e.baseAddress],
      }
    default:
      throw new Error('Unknown ExternalPluginAdapterKey type')
  }
}
