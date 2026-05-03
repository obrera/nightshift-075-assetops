import type {
  BaseAppData,
  BaseAppDataInitInfoArgs,
  BaseAppDataUpdateInfoArgs,
  ExternalPluginAdapterSchema,
  ExternalRegistryRecord,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import { parseExternalPluginAdapterData } from './lib.ts'
import type { LifecycleChecks } from './lifecycleChecks.ts'
import { type PluginAuthority, pluginAuthorityFromBase, pluginAuthorityToBase } from './pluginAuthority.ts'

export type AppData = {
  data?: unknown
  dataAuthority: PluginAuthority
} & Omit<BaseAppData, 'dataAuthority'>

export type AppDataInitInfoArgs = {
  dataAuthority: PluginAuthority
  initPluginAuthority?: PluginAuthority
  lifecycleChecks?: LifecycleChecks
  schema?: ExternalPluginAdapterSchema
  type: 'AppData'
} & Omit<BaseAppDataInitInfoArgs, 'dataAuthority' | 'initPluginAuthority' | 'lifecycleChecks'>

export type AppDataPlugin = {
  dataAuthority: PluginAuthority
  type: 'AppData'
} & AppData &
  BaseExternalPluginAdapter

export type AppDataUpdateInfoArgs = {
  key: ExternalPluginAdapterKey
  schema?: ExternalPluginAdapterSchema
} & Omit<BaseAppDataUpdateInfoArgs, 'schema'>

export function appDataFromBase(s: BaseAppData, r: ExternalRegistryRecord, account: Uint8Array): AppData {
  return {
    ...s,
    data: parseExternalPluginAdapterData(s, r, account),
    dataAuthority: pluginAuthorityFromBase(s.dataAuthority),
  }
}

export function appDataInitInfoArgsToBase(d: AppDataInitInfoArgs): BaseAppDataInitInfoArgs {
  return {
    dataAuthority: pluginAuthorityToBase(d.dataAuthority),
    initPluginAuthority: d.initPluginAuthority ? pluginAuthorityToBase(d.initPluginAuthority) : null,
    schema: d.schema ?? null,
  }
}

export function appDataUpdateInfoArgsToBase(d: AppDataUpdateInfoArgs): BaseAppDataUpdateInfoArgs {
  return {
    schema: d.schema ?? null,
  }
}

export const appDataManifest: ExternalPluginAdapterManifest<
  AppData,
  BaseAppData,
  AppDataInitInfoArgs,
  BaseAppDataInitInfoArgs,
  AppDataUpdateInfoArgs,
  BaseAppDataUpdateInfoArgs
> = {
  fromBase: appDataFromBase,
  initToBase: appDataInitInfoArgsToBase,
  type: 'AppData',
  updateToBase: appDataUpdateInfoArgsToBase,
}
