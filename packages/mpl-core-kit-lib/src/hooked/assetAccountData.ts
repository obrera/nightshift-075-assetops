import { createDecoder, type Decoder } from '@solana/codecs'
import type { AssetV1 as AssetV1Data, PluginHeaderV1 as PluginHeaderV1Data } from '../generated/index.ts'
import { getAssetV1Decoder, getPluginHeaderV1Decoder, Key } from '../generated/index.ts'
// Import from plugins module
import type { AssetPluginsList as PluginsAssetPluginsList, UpdateAuthority } from '../plugins/index.ts'
import { getPluginRegistryV1AccountDataDecoder } from './pluginRegistryV1Data.ts'

export type AssetV1AccountData = {
  pluginHeader?: PluginHeaderV1Data
  updateAuthority: UpdateAuthority
} & AssetPluginsList &
  Omit<AssetV1Data, 'updateAuthority'>

// Re-export for internal use
type AssetPluginsList = PluginsAssetPluginsList

export function getAssetV1AccountDataDecoder(): Decoder<AssetV1AccountData> {
  return createDecoder({
    read: (bytes, offset) => {
      const [asset, assetOffset] = getAssetV1Decoder().read(bytes, offset)
      if (asset.key !== Key.AssetV1) {
        throw new Error(`Expected an Asset account, got key: ${asset.key}`)
      }

      let pluginHeader: PluginHeaderV1Data | undefined
      let finalOffset = assetOffset

      if (bytes.length !== assetOffset) {
        ;[pluginHeader] = getPluginHeaderV1Decoder().read(bytes, assetOffset)

        const [, registryOffset] = getPluginRegistryV1AccountDataDecoder().read(
          bytes,
          Number(pluginHeader.pluginRegistryOffset),
        )
        finalOffset = registryOffset

        // TODO: Parse plugins when plugins module is ported
      }

      const updateAuth: UpdateAuthority = {
        address: asset.updateAuthority.__kind === 'None' ? undefined : asset.updateAuthority.fields[0],
        type: asset.updateAuthority.__kind,
      }

      return [
        {
          pluginHeader,
          ...asset,
          updateAuthority: updateAuth,
        },
        finalOffset,
      ]
    },
  })
}
