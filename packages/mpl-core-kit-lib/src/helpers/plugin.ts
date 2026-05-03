import { type Address, address } from '@solana/addresses'

import { type AssetV1, type CollectionV1, PluginType } from '../generated/index.ts'
import type { AssetPluginsList, UpdateAuthority } from '../plugins/index.ts'
import { capitalizeFirstLetter, lowercaseFirstLetter } from '../utils.ts'
import { hasAssetUpdateAuthority, hasPluginAddressAuthority } from './authority.ts'
import { collectionAddress, deriveAssetPlugins, isAssetOwner } from './state.ts'

export type AssetPluginKey = keyof AssetPluginsList

export type CheckPluginAuthoritiesArgs = {
  asset: { updateAuthority: UpdateAuthority } & AssetPluginsList & AssetV1
  authority: Address | string
  collection?: AssetPluginsList & CollectionV1
  pluginTypes: PluginType[]
}

/**
 * Convert a plugin type to a key for the asset plugins.
 * @param {PluginType} pluginType Plugin type
 * @returns {AssetPluginKey}
 */
export function assetPluginKeyFromType(pluginType: PluginType): AssetPluginKey {
  return lowercaseFirstLetter(PluginType[pluginType]) as AssetPluginKey
}

/**
 * Check the authority for the given plugin types on an asset.
 * @param {CheckPluginAuthoritiesArgs} args Arguments
 * @returns {boolean[]} Array of booleans indicating if the authority matches the plugin authority
 */
export function checkPluginAuthorities({
  asset,
  authority,
  collection,
  pluginTypes,
}: CheckPluginAuthoritiesArgs): boolean[] {
  const cAddress = collectionAddress(asset)
  if (cAddress && collection && cAddress !== collection.updateAuthority) {
    throw new Error('Collection mismatch')
  }

  const dAsset = deriveAssetPlugins(asset, collection)
  const auth = address(authority)
  const isUpdateAuth = hasAssetUpdateAuthority(auth, asset, collection)
  const isOwner = isAssetOwner(auth, asset)
  return pluginTypes.map((type) => {
    const plugin = (dAsset as AssetPluginsList)[assetPluginKeyFromType(type)]
    if (plugin) {
      if (
        hasPluginAddressAuthority(auth, plugin.authority) ||
        (plugin.authority.type === 'UpdateAuthority' && isUpdateAuth) ||
        (plugin.authority.type === 'Owner' && isOwner)
      ) {
        return true
      }
    }
    return false
  })
}

/**
 * Convert a plugin key to a type.
 * @param {AssetPluginKey} key Asset plugin key
 * @returns {PluginType}
 */
export function pluginTypeFromAssetPluginKey(key: AssetPluginKey): PluginType {
  return PluginType[capitalizeFirstLetter(key) as keyof typeof PluginType]
}
