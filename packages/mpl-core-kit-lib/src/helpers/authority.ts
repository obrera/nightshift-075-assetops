import { type Address, address } from '@solana/addresses'

import type { AssetV1, CollectionV1 } from '../generated/index.ts'
import type { AssetPluginsList, CollectionPluginsList, PluginAuthority, UpdateAuthority } from '../plugins/index.ts'
import { deriveAssetPlugins, isAssetOwner } from './state.ts'

/**
 * Check if the given address has the update authority for the asset.
 * If the asset specifies a collection as the update authority, the collection's update authority is checked.
 * If there are update delegates, they are also checked
 * @param {string | Address} addr Address
 * @param {AssetV1 & AssetPluginsList} asset Asset
 * @param {CollectionV1 & CollectionPluginsList | undefined} collection Collection
 * @returns {boolean} True if the address is the update authority
 */
export function hasAssetUpdateAuthority(
  addr: Address | string,
  asset: { updateAuthority: UpdateAuthority } & AssetPluginsList & AssetV1,
  collection?: CollectionPluginsList & CollectionV1,
): boolean {
  const key = address(addr)
  const dAsset = deriveAssetPlugins(asset as AssetPluginsList & AssetV1, collection) as {
    updateAuthority: UpdateAuthority
  } & AssetPluginsList &
    AssetV1
  const updateAuth = dAsset.updateAuthority

  if (updateAuth.type === 'Collection' && updateAuth.address !== collection?.updateAuthority) {
    throw Error('Collection mismatch')
  }

  // check if address matches asset update auth or collection or derived delegate plugin
  if (
    (updateAuth.type === 'Address' && updateAuth.address === key) ||
    (dAsset.updateDelegate?.authority.type === 'Address' && dAsset.updateDelegate?.authority.address === key) ||
    (dAsset.updateDelegate?.authority.type === 'Owner' && dAsset.owner === key) ||
    (updateAuth.type === 'Collection' && collection?.updateAuthority === key)
  ) {
    return true
  }

  return false
}

/**
 * Check if the given address has update authority for the collection.
 * @param {string | Address} addr Address
 * @param {CollectionV1 & CollectionPluginsList} collection Collection
 * @returns {boolean} True if the address is the update authority
 */
export function hasCollectionUpdateAuthority(
  addr: Address | string,
  collection: CollectionPluginsList & CollectionV1,
): boolean {
  const key = address(addr)
  if (
    collection.updateAuthority === key ||
    (collection.updateDelegate?.authority.type === 'Address' && collection.updateDelegate?.authority.address === key)
  ) {
    return true
  }
  return false
}

/**
 * Check if the given address has the Address authority for the plugin.
 * @param {Address | string} addr Address
 * @param {PluginAuthority} authority Plugin authority
 * @returns {boolean} True if the address has the authority
 */
export function hasPluginAddressAuthority(addr: Address | string, authority: PluginAuthority): boolean {
  return authority.type === 'Address' && authority.address === address(addr)
}

/**
 * Check if the given address has the Owner authority for the plugin.
 * @param {Address | string} addr Address
 * @param {PluginAuthority} authority Plugin authority
 * @param {AssetV1} asset Asset
 * @returns {boolean} True if the address has the authority
 */
export function hasPluginOwnerAuthority(addr: Address | string, authority: PluginAuthority, asset: AssetV1): boolean {
  return authority.type === 'Owner' && isAssetOwner(addr, asset)
}

/**
 * Check if the given address has the UpdateAuthority authority for the plugin.
 * @param {Address | string} addr Address
 * @param {PluginAuthority} authority Plugin authority
 * @param {AssetV1 & AssetPluginsList} asset Asset
 * @param {CollectionV1 & CollectionPluginsList | undefined} collection Collection
 * @returns {boolean} True if the address has the authority
 */
export function hasPluginUpdateAuthority(
  addr: Address | string,
  authority: PluginAuthority,
  asset: { updateAuthority: UpdateAuthority } & AssetPluginsList & AssetV1,
  collection?: CollectionPluginsList & CollectionV1,
): boolean {
  return authority.type === 'UpdateAuthority' && hasAssetUpdateAuthority(addr, asset, collection)
}
