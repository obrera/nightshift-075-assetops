import type { Address } from '@solana/addresses'

import type {
  BaseLifecycleHook,
  BaseLifecycleHookInitInfoArgs,
  BaseLifecycleHookUpdateInfoArgs,
  ExternalPluginAdapterSchema,
  ExternalRegistryRecord,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import { type ExtraAccount, extraAccountFromBase, extraAccountToBase } from './extraAccount.ts'
import { parseExternalPluginAdapterData } from './lib.ts'
import { type LifecycleChecks, lifecycleChecksToBase } from './lifecycleChecks.ts'
import { type PluginAuthority, pluginAuthorityFromBase, pluginAuthorityToBase } from './pluginAuthority.ts'

export type LifecycleHook = {
  data?: unknown
  dataAuthority?: PluginAuthority
  extraAccounts?: Array<ExtraAccount>
} & Omit<BaseLifecycleHook, 'dataAuthority' | 'extraAccounts'>

export type LifecycleHookInitInfoArgs = {
  dataAuthority?: PluginAuthority
  extraAccounts?: Array<ExtraAccount>
  initPluginAuthority?: PluginAuthority
  lifecycleChecks: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
  type: 'LifecycleHook'
} & Omit<
  BaseLifecycleHookInitInfoArgs,
  'dataAuthority' | 'extraAccounts' | 'initPluginAuthority' | 'lifecycleChecks' | 'schema'
>

export type LifecycleHookPlugin = {
  hookedProgram: Address
  type: 'LifecycleHook'
} & BaseExternalPluginAdapter &
  LifecycleHook

export type LifecycleHookUpdateInfoArgs = {
  extraAccounts?: Array<ExtraAccount>
  key: ExternalPluginAdapterKey
  lifecycleChecks?: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
} & Omit<BaseLifecycleHookUpdateInfoArgs, 'extraAccounts' | 'lifecycleChecks' | 'schema'>

export function lifecycleHookFromBase(
  s: BaseLifecycleHook,
  r: ExternalRegistryRecord,
  account: Uint8Array,
): LifecycleHook {
  return {
    ...s,
    data: parseExternalPluginAdapterData(s, r, account),
    dataAuthority: s.dataAuthority.__option === 'Some' ? pluginAuthorityFromBase(s.dataAuthority.value) : undefined,
    extraAccounts: s.extraAccounts.__option === 'Some' ? s.extraAccounts.value.map(extraAccountFromBase) : undefined,
  }
}

export function lifecycleHookInitInfoArgsToBase(l: LifecycleHookInitInfoArgs): BaseLifecycleHookInitInfoArgs {
  return {
    dataAuthority: l.dataAuthority ? pluginAuthorityToBase(l.dataAuthority) : null,
    extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccountToBase) : null,
    hookedProgram: l.hookedProgram,
    initPluginAuthority: l.initPluginAuthority ? pluginAuthorityToBase(l.initPluginAuthority) : null,
    lifecycleChecks: lifecycleChecksToBase(l.lifecycleChecks),
    schema: l.schema ?? null,
  }
}

export function lifecycleHookUpdateInfoArgsToBase(l: LifecycleHookUpdateInfoArgs): BaseLifecycleHookUpdateInfoArgs {
  return {
    extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccountToBase) : null,
    lifecycleChecks: l.lifecycleChecks ? lifecycleChecksToBase(l.lifecycleChecks) : null,
    schema: l.schema ?? null,
  }
}

export const lifecycleHookManifest: ExternalPluginAdapterManifest<
  LifecycleHook,
  BaseLifecycleHook,
  LifecycleHookInitInfoArgs,
  BaseLifecycleHookInitInfoArgs,
  LifecycleHookUpdateInfoArgs,
  BaseLifecycleHookUpdateInfoArgs
> = {
  fromBase: lifecycleHookFromBase,
  initToBase: lifecycleHookInitInfoArgsToBase,
  type: 'LifecycleHook',
  updateToBase: lifecycleHookUpdateInfoArgsToBase,
}
