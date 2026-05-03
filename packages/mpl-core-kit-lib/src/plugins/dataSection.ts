import type {
  BaseDataSection,
  BaseDataSectionInitInfoArgs,
  BaseDataSectionUpdateInfoArgs,
  ExternalRegistryRecord,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import { parseExternalPluginAdapterData } from './lib.ts'
import { type LinkedDataKey, linkedDataKeyFromBase, linkedDataKeyToBase } from './linkedDataKey.ts'
import { type PluginAuthority, pluginAuthorityFromBase } from './pluginAuthority.ts'

export type DataSection = {
  data?: unknown
  dataAuthority?: PluginAuthority
  parentKey: LinkedDataKey
} & Omit<BaseDataSection, 'dataAuthority' | 'parentKey'>

export type DataSectionInitInfoArgs = {
  parentKey: LinkedDataKey
  type: 'DataSection'
} & Omit<BaseDataSectionInitInfoArgs, 'parentKey'>

export type DataSectionPlugin = {
  type: 'DataSection'
} & BaseExternalPluginAdapter &
  DataSection

export type DataSectionUpdateInfoArgs = {
  key: ExternalPluginAdapterKey
} & BaseDataSectionUpdateInfoArgs

export function dataSectionFromBase(s: BaseDataSection, r: ExternalRegistryRecord, account: Uint8Array): DataSection {
  return {
    ...s,
    data: parseExternalPluginAdapterData(s, r, account),
    dataAuthority:
      s.parentKey.__kind !== 'LinkedLifecycleHook' ? pluginAuthorityFromBase(s.parentKey.fields[0]) : undefined,
    parentKey: linkedDataKeyFromBase(s.parentKey),
  }
}

export function dataSectionInitInfoArgsToBase(d: DataSectionInitInfoArgs): BaseDataSectionInitInfoArgs {
  return {
    parentKey: linkedDataKeyToBase(d.parentKey),
    schema: d.schema,
  }
}

export function dataSectionUpdateInfoArgsToBase(_d: DataSectionUpdateInfoArgs): BaseDataSectionUpdateInfoArgs {
  // You can't update the data section directly
  return {}
}

export const dataSectionManifest: ExternalPluginAdapterManifest<
  DataSection,
  BaseDataSection,
  DataSectionInitInfoArgs,
  BaseDataSectionInitInfoArgs,
  DataSectionUpdateInfoArgs,
  BaseDataSectionUpdateInfoArgs
> = {
  fromBase: dataSectionFromBase,
  initToBase: dataSectionInitInfoArgsToBase,
  type: 'DataSection',
  updateToBase: dataSectionUpdateInfoArgsToBase,
}
