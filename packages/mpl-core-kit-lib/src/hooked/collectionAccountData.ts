import { createDecoder, type Decoder } from '@solana/codecs'
import type { CollectionV1 as CollectionV1Data, PluginHeaderV1 as PluginHeaderV1Data } from '../generated/index.ts'
import { getCollectionV1Decoder, getPluginHeaderV1Decoder, Key } from '../generated/index.ts'
import type { CollectionPluginsList as PluginsCollectionPluginsList } from '../plugins/types.ts'
import { getPluginRegistryV1AccountDataDecoder } from './pluginRegistryV1Data.ts'

export type CollectionV1AccountData = {
  pluginHeader?: PluginHeaderV1Data
} & CollectionPluginsList &
  CollectionV1Data

// Re-export for internal use
type CollectionPluginsList = PluginsCollectionPluginsList

export function getCollectionV1AccountDataDecoder(): Decoder<CollectionV1AccountData> {
  return createDecoder({
    read: (bytes, offset) => {
      const [collection, collectionOffset] = getCollectionV1Decoder().read(bytes, offset)
      if (collection.key !== Key.CollectionV1) {
        throw new Error(`Expected a Collection account, got key: ${collection.key}`)
      }

      let pluginHeader: PluginHeaderV1Data | undefined
      let finalOffset = collectionOffset

      if (bytes.length !== collectionOffset) {
        ;[pluginHeader] = getPluginHeaderV1Decoder().read(bytes, collectionOffset)

        const [, registryOffset] = getPluginRegistryV1AccountDataDecoder().read(
          bytes,
          Number(pluginHeader.pluginRegistryOffset),
        )
        finalOffset = registryOffset

        // TODO: Parse plugins when plugins module is ported
      }

      return [
        {
          pluginHeader,
          ...collection,
        },
        finalOffset,
      ]
    },
  })
}
