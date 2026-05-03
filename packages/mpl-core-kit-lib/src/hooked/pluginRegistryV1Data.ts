import {
  createDecoder,
  type Decoder,
  getArrayDecoder,
  getOptionDecoder,
  getTupleDecoder,
  getU64Decoder,
} from '@solana/codecs'
import type {
  ExternalRegistryRecord as ExternalRegistryRecordData,
  RegistryRecord as RegistryRecordData,
} from '../generated/index.ts'
import {
  ExternalPluginAdapterType,
  getBasePluginAuthorityDecoder,
  getExternalCheckResultDecoder,
  getExternalPluginAdapterTypeDecoder,
  getHookableLifecycleEventDecoder,
  getKeyDecoder,
  getPluginTypeDecoder,
  Key,
  PluginType,
} from '../generated/index.ts'

export type ExternalRegistryRecordWithUnknown = {
  isUnknown?: boolean
} & ExternalRegistryRecordData

export type PluginRegistryV1AccountData = {
  externalRegistry: ExternalRegistryRecordData[]
  key: Key
  registry: RegistryRecordData[]
}

export type RegistryRecordWithUnknown = {
  isUnknown?: boolean
} & RegistryRecordData

export function getExternalRegistryRecordWithUnknownDecoder(): Decoder<ExternalRegistryRecordWithUnknown> {
  return createDecoder({
    read: (bytes, offset) => {
      let pluginType = ExternalPluginAdapterType.AppData
      let pluginTypeOffset = offset + 1
      let isUnknown = true

      try {
        ;[pluginType, pluginTypeOffset] = getExternalPluginAdapterTypeDecoder().read(bytes, offset)
        isUnknown = false
      } catch {
        // Unknown plugin type
      }

      const [authority, authorityOffset] = getBasePluginAuthorityDecoder().read(bytes, pluginTypeOffset)

      const lifecycleChecksDecoder = getOptionDecoder(
        getArrayDecoder(getTupleDecoder([getHookableLifecycleEventDecoder(), getExternalCheckResultDecoder()])),
      )
      const [lifecycleChecks, lifecycleChecksOffset] = lifecycleChecksDecoder.read(bytes, authorityOffset)

      const [pluginOffset, pluginOffsetOffset] = getU64Decoder().read(bytes, lifecycleChecksOffset)

      const optionU64Decoder = getOptionDecoder(getU64Decoder())
      const [dataOffset, dataOffsetOffset] = optionU64Decoder.read(bytes, pluginOffsetOffset)
      const [dataLen, dataLenOffset] = optionU64Decoder.read(bytes, dataOffsetOffset)

      return [
        {
          authority,
          dataLen,
          dataOffset,
          isUnknown,
          lifecycleChecks,
          offset: pluginOffset,
          pluginType,
        },
        dataLenOffset,
      ]
    },
  })
}

export function getPluginRegistryV1AccountDataDecoder(): Decoder<PluginRegistryV1AccountData> {
  return createDecoder({
    read: (bytes, offset) => {
      const [key, keyOffset] = getKeyDecoder().read(bytes, offset)
      if (key !== Key.PluginRegistryV1) {
        throw new Error(`Expected a PluginRegistryV1 account, got key: ${key}`)
      }

      const registryDecoder = getArrayDecoder(getRegistryRecordWithUnknownDecoder())
      const [registry, registryOffset] = registryDecoder.read(bytes, keyOffset)

      const externalRegistryDecoder = getArrayDecoder(getExternalRegistryRecordWithUnknownDecoder())
      const [externalRegistry, externalRegistryOffset] = externalRegistryDecoder.read(bytes, registryOffset)

      return [
        {
          externalRegistry: externalRegistry.filter((record) => !record.isUnknown),
          key,
          registry: registry.filter((record) => !record.isUnknown),
        },
        externalRegistryOffset,
      ]
    },
  })
}

export function getRegistryRecordWithUnknownDecoder(): Decoder<RegistryRecordWithUnknown> {
  return createDecoder({
    read: (bytes, offset) => {
      let pluginType = PluginType.Attributes
      let pluginTypeOffset = offset + 1
      let isUnknown = true

      try {
        ;[pluginType, pluginTypeOffset] = getPluginTypeDecoder().read(bytes, offset)
        isUnknown = false
      } catch {
        // Unknown plugin type
      }

      const [authority, authorityOffset] = getBasePluginAuthorityDecoder().read(bytes, pluginTypeOffset)
      const [pluginOffset, pluginOffsetOffset] = getU64Decoder().read(bytes, authorityOffset)

      return [
        {
          authority,
          isUnknown,
          offset: pluginOffset,
          pluginType,
        },
        pluginOffsetOffset,
      ]
    },
  })
}
