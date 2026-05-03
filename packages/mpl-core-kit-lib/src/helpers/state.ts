import { type Address, address } from '@solana/addresses'

import type { AssetV1, CollectionV1 } from '../generated/index.ts'
import type { AssetPluginsList, CollectionPluginsList } from '../plugins/index.ts'

/**
 * Find the collection address for the given asset if it is part of a collection.
 * @param {AssetV1} asset Asset
 * @returns {Address | undefined} Collection address
 */
export function collectionAddress(
  asset: { updateAuthority: { address?: Address; type: string } } & AssetV1,
): Address | undefined {
  if (asset.updateAuthority.type === 'Collection') {
    return asset.updateAuthority.address
  }

  return undefined
}

/**
 * Derive the asset plugins from the asset and collection. Plugins on the asset take precedence over plugins on the collection.
 * @param {AssetV1 & AssetPluginsList} asset Asset with plugins
 * @param {CollectionV1 & CollectionPluginsList | undefined} collection Collection with plugins
 * @returns {AssetV1 & AssetPluginsList} Asset with derived plugins
 */
export function deriveAssetPlugins<T extends AssetPluginsList & AssetV1>(
  asset: T,
  collection?: CollectionPluginsList & CollectionV1,
): T {
  if (!collection) {
    return asset
  }

  // Merge plugins from collection into asset, asset takes precedence
  // List of common plugin keys that can be inherited from collection
  const inheritablePluginKeys: (keyof AssetPluginsList)[] = [
    'addBlocker',
    'attributes',
    'autograph',
    'freezeExecute',
    'immutableMetadata',
    'permanentBurnDelegate',
    'permanentFreezeDelegate',
    'permanentFreezeExecute',
    'permanentTransferDelegate',
    'royalties',
    'updateDelegate',
    'verifiedCreators',
  ]

  const mergedPlugins = inheritablePluginKeys.reduce(
    (plugins, key) => {
      const assetPlugin = (asset as AssetPluginsList)[key]
      const collectionPlugin = (collection as CollectionPluginsList)[key as keyof CollectionPluginsList]

      if (assetPlugin) {
        return {
          ...plugins,
          [key]: assetPlugin,
        }
      }

      if (collectionPlugin) {
        return {
          ...plugins,
          [key]: collectionPlugin,
        }
      }

      return plugins
    },
    {} as Partial<AssetPluginsList>,
  )

  return {
    ...asset,
    ...mergedPlugins,
  }
}

/**
 * Check if the given address is the owner of the asset.
 * @param {string | Address} addr Address
 * @param {AssetV1} asset Asset
 * @returns {boolean} True if the address is the owner
 */
export function isAssetOwner(addr: Address | string, asset: AssetV1): boolean {
  const key = address(addr)
  return key === asset.owner
}

/**
 * Check if the asset is frozen.
 * @param {AssetV1 & AssetPluginsList} asset Asset with plugins
 * @param {CollectionV1 & CollectionPluginsList | undefined} collection Collection with plugins
 * @returns {boolean} True if the asset is frozen
 */
export function isFrozen(
  asset: AssetPluginsList & AssetV1,
  collection?: CollectionPluginsList & CollectionV1,
): boolean {
  const dAsset = deriveAssetPlugins(asset, collection)
  return (
    (dAsset as AssetPluginsList).freezeDelegate?.frozen ||
    (dAsset as AssetPluginsList).permanentFreezeDelegate?.frozen ||
    false
  )
}
