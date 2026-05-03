import type {
  BaseLinkedAppData,
  BaseLinkedAppDataInitInfoArgs,
  BaseLinkedAppDataUpdateInfoArgs,
  ExternalPluginAdapterSchema,
  ExternalRegistryRecord,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import type { LifecycleChecks } from './lifecycleChecks.ts'
import { type PluginAuthority, pluginAuthorityFromBase, pluginAuthorityToBase } from './pluginAuthority.ts'

export type LinkedAppData = {
  data?: unknown
  dataAuthority: PluginAuthority
} & Omit<BaseLinkedAppData, 'dataAuthority'>

export type LinkedAppDataInitInfoArgs = {
  dataAuthority: PluginAuthority
  initPluginAuthority?: PluginAuthority
  lifecycleChecks?: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
  type: 'LinkedAppData'
} & Omit<BaseLinkedAppDataInitInfoArgs, 'dataAuthority' | 'initPluginAuthority' | 'lifecycleChecks'>

export type LinkedAppDataPlugin = {
  dataAuthority: PluginAuthority
  type: 'LinkedAppData'
} & BaseExternalPluginAdapter &
  LinkedAppData

export type LinkedAppDataUpdateInfoArgs = {
  key: ExternalPluginAdapterKey
  schema?: ExternalPluginAdapterSchema
} & Omit<BaseLinkedAppDataUpdateInfoArgs, 'schema'>

export function linkedAppDataFromBase(
  s: BaseLinkedAppData,
  _r: ExternalRegistryRecord,
  _account: Uint8Array,
): LinkedAppData {
  return {
    ...s,
    dataAuthority: pluginAuthorityFromBase(s.dataAuthority),
    // plugin has no data but injected in the derivation of the asset
  }
}

export function linkedAppDataInitInfoArgsToBase(d: LinkedAppDataInitInfoArgs): BaseLinkedAppDataInitInfoArgs {
  return {
    dataAuthority: pluginAuthorityToBase(d.dataAuthority),
    initPluginAuthority: d.initPluginAuthority ? pluginAuthorityToBase(d.initPluginAuthority) : null,
    schema: d.schema ?? null,
  }
}

export function linkedAppDataUpdateInfoArgsToBase(d: LinkedAppDataUpdateInfoArgs): BaseLinkedAppDataUpdateInfoArgs {
  return {
    schema: d.schema ?? null,
  }
}

export const linkedAppDataManifest: ExternalPluginAdapterManifest<
  LinkedAppData,
  BaseLinkedAppData,
  LinkedAppDataInitInfoArgs,
  BaseLinkedAppDataInitInfoArgs,
  LinkedAppDataUpdateInfoArgs,
  BaseLinkedAppDataUpdateInfoArgs
> = {
  fromBase: linkedAppDataFromBase,
  initToBase: linkedAppDataInitInfoArgsToBase,
  type: 'LinkedAppData',
  updateToBase: linkedAppDataUpdateInfoArgsToBase,
}
