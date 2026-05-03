import {
  type BaseExternalPluginAdapterInitInfoArgs,
  type BaseExternalPluginAdapterKey,
  type BaseExternalPluginAdapterUpdateInfoArgs,
  type ExternalCheckResult,
  type ExternalRegistryRecord,
  getExternalPluginAdapterDecoder,
  type HookableLifecycleEvent,
} from '../generated/index.ts'
import {
  type AppDataInitInfoArgs,
  type AppDataPlugin,
  type AppDataUpdateInfoArgs,
  appDataFromBase,
  appDataManifest,
} from './appData.ts'
import { type DataSectionPlugin, dataSectionFromBase, dataSectionManifest } from './dataSection.ts'
import { type LifecycleChecksContainer, lifecycleChecksFromBase } from './lifecycleChecks.ts'
import {
  type LifecycleHookInitInfoArgs,
  type LifecycleHookPlugin,
  type LifecycleHookUpdateInfoArgs,
  lifecycleHookFromBase,
  lifecycleHookManifest,
} from './lifecycleHook.ts'
import {
  type LinkedAppDataInitInfoArgs,
  type LinkedAppDataPlugin,
  type LinkedAppDataUpdateInfoArgs,
  linkedAppDataFromBase,
  linkedAppDataManifest,
} from './linkedAppData.ts'
import {
  type LinkedLifecycleHookInitInfoArgs,
  type LinkedLifecycleHookPlugin,
  type LinkedLifecycleHookUpdateInfoArgs,
  linkedLifecycleHookFromBase,
  linkedLifecycleHookManifest,
} from './linkedLifecycleHook.ts'
import {
  type OracleInitInfoArgs,
  type OraclePlugin,
  type OracleUpdateInfoArgs,
  oracleFromBase,
  oracleManifest,
} from './oracle.ts'
import { pluginAuthorityFromBase } from './pluginAuthority.ts'
import type { BasePlugin } from './types.ts'

export type BaseExternalPluginAdapter = BasePlugin & ExternalPluginAdapterData & LifecycleChecksContainer

export type ExternalPluginAdapterInitInfoArgs =
  | ({
      type: 'AppData'
    } & AppDataInitInfoArgs)
  | ({
      type: 'DataSection'
    } & AppDataInitInfoArgs)
  | ({
      type: 'LifecycleHook'
    } & LifecycleHookInitInfoArgs)
  | ({
      type: 'LinkedAppData'
    } & LinkedAppDataInitInfoArgs)
  | ({
      type: 'LinkedLifecycleHook'
    } & LinkedLifecycleHookInitInfoArgs)
  | ({
      type: 'Oracle'
    } & OracleInitInfoArgs)

export type ExternalPluginAdapters =
  | AppDataPlugin
  | DataSectionPlugin
  | LifecycleHookPlugin
  | LinkedAppDataPlugin
  | LinkedLifecycleHookPlugin
  | OraclePlugin

export type ExternalPluginAdaptersList = {
  appDatas?: AppDataPlugin[]
  dataSections?: DataSectionPlugin[]
  lifecycleHooks?: LifecycleHookPlugin[]
  linkedAppDatas?: LinkedAppDataPlugin[]
  linkedLifecycleHooks?: LinkedLifecycleHookPlugin[]
  oracles?: OraclePlugin[]
}

export type ExternalPluginAdapterTypeString = BaseExternalPluginAdapterKey['__kind']

export type ExternalPluginAdapterUpdateInfoArgs =
  | ({
      type: 'AppData'
    } & AppDataUpdateInfoArgs)
  | ({
      type: 'LifecycleHook'
    } & LifecycleHookUpdateInfoArgs)
  | ({
      type: 'LinkedAppData'
    } & LinkedAppDataUpdateInfoArgs)
  | ({
      type: 'LinkedLifecycleHook'
    } & LinkedLifecycleHookUpdateInfoArgs)
  | ({
      type: 'Oracle'
    } & OracleUpdateInfoArgs)

export const externalPluginAdapterManifests = {
  AppData: appDataManifest,
  DataSection: dataSectionManifest,
  LifecycleHook: lifecycleHookManifest,
  LinkedAppData: linkedAppDataManifest,
  LinkedLifecycleHook: linkedLifecycleHookManifest,
  Oracle: oracleManifest,
}

export type ExternalPluginAdapterData = {
  dataLen?: bigint
  dataOffset?: bigint
}

export function externalRegistryRecordsToExternalPluginAdapterList(
  records: ExternalRegistryRecord[],
  accountData: Uint8Array,
): ExternalPluginAdaptersList {
  const result: ExternalPluginAdaptersList = {}

  records.forEach((record) => {
    const deserializedPlugin = getExternalPluginAdapterDecoder().read(accountData, Number(record.offset))[0]

    const mappedPlugin: BaseExternalPluginAdapter = {
      authority: pluginAuthorityFromBase(record.authority),
      lifecycleChecks:
        record.lifecycleChecks.__option === 'Some'
          ? lifecycleChecksFromBase(record.lifecycleChecks.value as [HookableLifecycleEvent, ExternalCheckResult][])
          : undefined,
      offset: record.offset,
    }

    if (deserializedPlugin.__kind === 'LifecycleHook') {
      if (!result.lifecycleHooks) {
        result.lifecycleHooks = []
      }
      result.lifecycleHooks.push({
        dataLen: record.dataLen.__option === 'Some' ? record.dataLen.value : undefined,
        dataOffset: record.dataOffset.__option === 'Some' ? record.dataOffset.value : undefined,
        type: 'LifecycleHook',
        ...mappedPlugin,
        ...lifecycleHookFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    } else if (deserializedPlugin.__kind === 'AppData') {
      if (!result.appDatas) {
        result.appDatas = []
      }
      result.appDatas.push({
        dataLen: record.dataLen.__option === 'Some' ? record.dataLen.value : undefined,
        dataOffset: record.dataOffset.__option === 'Some' ? record.dataOffset.value : undefined,
        type: 'AppData',
        ...mappedPlugin,
        ...appDataFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    } else if (deserializedPlugin.__kind === 'Oracle') {
      if (!result.oracles) {
        result.oracles = []
      }

      result.oracles.push({
        type: 'Oracle',
        ...mappedPlugin,
        ...oracleFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    } else if (deserializedPlugin.__kind === 'LinkedLifecycleHook') {
      if (!result.linkedLifecycleHooks) {
        result.linkedLifecycleHooks = []
      }
      result.linkedLifecycleHooks.push({
        type: 'LinkedLifecycleHook',
        ...mappedPlugin,
        ...linkedLifecycleHookFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    } else if (deserializedPlugin.__kind === 'LinkedAppData') {
      if (!result.linkedAppDatas) {
        result.linkedAppDatas = []
      }
      result.linkedAppDatas.push({
        type: 'LinkedAppData',
        ...mappedPlugin,
        ...linkedAppDataFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    } else if (deserializedPlugin.__kind === 'DataSection') {
      if (!result.dataSections) {
        result.dataSections = []
      }
      result.dataSections.push({
        dataLen: record.dataLen.__option === 'Some' ? record.dataLen.value : undefined,
        dataOffset: record.dataOffset.__option === 'Some' ? record.dataOffset.value : undefined,
        type: 'DataSection',
        ...mappedPlugin,
        ...dataSectionFromBase(deserializedPlugin.fields[0], record, accountData),
      })
    }
  })

  return result
}

export const isExternalPluginAdapterType = (plugin: { type: string }) => {
  if (
    plugin.type === 'LifecycleHook' ||
    plugin.type === 'Oracle' ||
    plugin.type === 'AppData' ||
    plugin.type === 'LinkedLifecycleHook' ||
    plugin.type === 'DataSection' ||
    plugin.type === 'LinkedAppData'
  ) {
    return true
  }
  return false
}

export function createExternalPluginAdapterInitInfo({
  type,
  ...args
}: ExternalPluginAdapterInitInfoArgs): BaseExternalPluginAdapterInitInfoArgs {
  const manifest = externalPluginAdapterManifests[type]

  return {
    __kind: type,
    // Vendored adapter manifests have type-safe per-variant serializers, but this
    // dispatcher loses that discrimination at the callsite.
    fields: [manifest.initToBase(args as never)],
  } as BaseExternalPluginAdapterInitInfoArgs
}

export function createExternalPluginAdapterUpdateInfo({
  type,
  ...args
}: ExternalPluginAdapterUpdateInfoArgs): BaseExternalPluginAdapterUpdateInfoArgs {
  const manifest = externalPluginAdapterManifests[type as keyof typeof externalPluginAdapterManifests]

  return {
    __kind: type,
    // Vendored adapter manifests have type-safe per-variant serializers, but this
    // dispatcher loses that discrimination at the callsite.
    fields: [manifest.updateToBase(args as never)],
  } as unknown as BaseExternalPluginAdapterUpdateInfoArgs
}
