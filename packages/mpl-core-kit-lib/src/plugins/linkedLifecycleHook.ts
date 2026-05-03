import type { Address } from '@solana/addresses'

import type {
  BaseLinkedLifecycleHook,
  BaseLinkedLifecycleHookInitInfoArgs,
  BaseLinkedLifecycleHookUpdateInfoArgs,
  ExternalPluginAdapterSchema,
  ExternalRegistryRecord,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import { type ExtraAccount, extraAccountFromBase, extraAccountToBase } from './extraAccount.ts'
import { type LifecycleChecks, lifecycleChecksToBase } from './lifecycleChecks.ts'
import { type PluginAuthority, pluginAuthorityFromBase, pluginAuthorityToBase } from './pluginAuthority.ts'

export type LinkedLifecycleHook = {
  data?: unknown
  dataAuthority?: PluginAuthority
  extraAccounts?: Array<ExtraAccount>
} & Omit<BaseLinkedLifecycleHook, 'dataAuthority' | 'extraAccounts'>

export type LinkedLifecycleHookInitInfoArgs = {
  dataAuthority?: PluginAuthority
  extraAccounts?: Array<ExtraAccount>
  initPluginAuthority?: PluginAuthority
  lifecycleChecks: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
  type: 'LinkedLifecycleHook'
} & Omit<
  BaseLinkedLifecycleHookInitInfoArgs,
  'dataAuthority' | 'extraAccounts' | 'initPluginAuthority' | 'lifecycleChecks' | 'schema'
>

export type LinkedLifecycleHookPlugin = {
  hookedProgram: Address
  type: 'LinkedLifecycleHook'
} & BaseExternalPluginAdapter &
  LinkedLifecycleHook

export type LinkedLifecycleHookUpdateInfoArgs = {
  extraAccounts?: Array<ExtraAccount>
  key: ExternalPluginAdapterKey
  lifecycleChecks?: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
} & Omit<BaseLinkedLifecycleHookUpdateInfoArgs, 'extraAccounts' | 'lifecycleChecks' | 'schema'>

export function linkedLifecycleHookFromBase(
  s: BaseLinkedLifecycleHook,
  _r: ExternalRegistryRecord,
  _account: Uint8Array,
): LinkedLifecycleHook {
  return {
    ...s,
    dataAuthority: s.dataAuthority.__option === 'Some' ? pluginAuthorityFromBase(s.dataAuthority.value) : undefined,
    extraAccounts: s.extraAccounts.__option === 'Some' ? s.extraAccounts.value.map(extraAccountFromBase) : undefined,
  }
}

export function linkedLifecycleHookInitInfoArgsToBase(
  l: LinkedLifecycleHookInitInfoArgs,
): BaseLinkedLifecycleHookInitInfoArgs {
  return {
    dataAuthority: l.dataAuthority ? pluginAuthorityToBase(l.dataAuthority) : null,
    extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccountToBase) : null,
    hookedProgram: l.hookedProgram,
    initPluginAuthority: l.initPluginAuthority ? pluginAuthorityToBase(l.initPluginAuthority) : null,
    lifecycleChecks: lifecycleChecksToBase(l.lifecycleChecks),
    schema: l.schema ? l.schema : null,
  }
}

export function linkedLifecycleHookUpdateInfoArgsToBase(
  l: LinkedLifecycleHookUpdateInfoArgs,
): BaseLinkedLifecycleHookUpdateInfoArgs {
  return {
    extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccountToBase) : null,
    lifecycleChecks: l.lifecycleChecks ? lifecycleChecksToBase(l.lifecycleChecks) : null,
    schema: l.schema ?? null,
  }
}

export const linkedLifecycleHookManifest: ExternalPluginAdapterManifest<
  LinkedLifecycleHook,
  BaseLinkedLifecycleHook,
  LinkedLifecycleHookInitInfoArgs,
  BaseLinkedLifecycleHookInitInfoArgs,
  LinkedLifecycleHookUpdateInfoArgs,
  BaseLinkedLifecycleHookUpdateInfoArgs
> = {
  fromBase: linkedLifecycleHookFromBase,
  initToBase: linkedLifecycleHookInitInfoArgsToBase,
  type: 'LinkedLifecycleHook',
  updateToBase: linkedLifecycleHookUpdateInfoArgsToBase,
}
