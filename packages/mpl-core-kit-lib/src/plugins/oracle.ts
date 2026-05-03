import {
  type BaseOracle,
  type BaseOracleInitInfoArgs,
  type BaseOracleUpdateInfoArgs,
  type ExternalRegistryRecord,
  getOracleValidationDecoder,
  type OracleValidation,
} from '../generated/index.ts'
import type { ExternalPluginAdapterKey } from './externalPluginAdapterKey.ts'
import type { ExternalPluginAdapterManifest } from './externalPluginAdapterManifest.ts'
import type { BaseExternalPluginAdapter } from './externalPluginAdapters.ts'
import { type ExtraAccount, extraAccountFromBase, extraAccountToBase } from './extraAccount.ts'
import { type LifecycleChecks, lifecycleChecksToBase } from './lifecycleChecks.ts'
import { type PluginAuthority, pluginAuthorityToBase } from './pluginAuthority.ts'
import {
  type ValidationResultsOffset,
  validationResultsOffsetFromBase,
  validationResultsOffsetToBase,
} from './validationResultsOffset.ts'

export type Oracle = {
  baseAddressConfig?: ExtraAccount
  resultsOffset: ValidationResultsOffset
} & Omit<BaseOracle, 'baseAddressConfig' | 'resultsOffset'>

export type OracleInitInfoArgs = {
  baseAddressConfig?: ExtraAccount
  initPluginAuthority?: PluginAuthority
  lifecycleChecks: LifecycleChecks
  resultsOffset?: ValidationResultsOffset
  type: 'Oracle'
} & Omit<BaseOracleInitInfoArgs, 'baseAddressConfig' | 'initPluginAuthority' | 'lifecycleChecks' | 'resultsOffset'>

export type OraclePlugin = {
  type: 'Oracle'
} & BaseExternalPluginAdapter &
  Oracle

export type OracleUpdateInfoArgs = {
  baseAddressConfig?: ExtraAccount
  key: ExternalPluginAdapterKey
  lifecycleChecks?: LifecycleChecks
  resultsOffset?: ValidationResultsOffset
} & Omit<BaseOracleUpdateInfoArgs, 'baseAddressConfig' | 'lifecycleChecks' | 'resultsOffset'>

export function deserializeOracleValidation(data: Uint8Array, offset: ValidationResultsOffset): OracleValidation {
  let offs = 0
  if (offset.type === 'Custom') {
    offs = Number(offset.offset)
  } else if (offset.type === 'Anchor') {
    offs = 8
  }

  return getOracleValidationDecoder().read(data, offs)[0]
}

export function oracleFromBase(s: BaseOracle, _r: ExternalRegistryRecord, _account: Uint8Array): Oracle {
  return {
    ...s,
    baseAddressConfig:
      s.baseAddressConfig.__option === 'Some' ? extraAccountFromBase(s.baseAddressConfig.value) : undefined,
    resultsOffset: validationResultsOffsetFromBase(s.resultsOffset),
  }
}

export function oracleInitInfoArgsToBase(o: OracleInitInfoArgs): BaseOracleInitInfoArgs {
  return {
    baseAddress: o.baseAddress,
    baseAddressConfig: o.baseAddressConfig ? extraAccountToBase(o.baseAddressConfig) : null,
    initPluginAuthority: o.initPluginAuthority ? pluginAuthorityToBase(o.initPluginAuthority) : null,
    lifecycleChecks: lifecycleChecksToBase(o.lifecycleChecks),
    resultsOffset: o.resultsOffset ? validationResultsOffsetToBase(o.resultsOffset) : null,
  }
}

export function oracleUpdateInfoArgsToBase(o: OracleUpdateInfoArgs): BaseOracleUpdateInfoArgs {
  return {
    baseAddressConfig: o.baseAddressConfig ? extraAccountToBase(o.baseAddressConfig) : null,
    lifecycleChecks: o.lifecycleChecks ? lifecycleChecksToBase(o.lifecycleChecks) : null,
    resultsOffset: o.resultsOffset ? validationResultsOffsetToBase(o.resultsOffset) : null,
  }
}

export const oracleManifest: ExternalPluginAdapterManifest<
  Oracle,
  BaseOracle,
  OracleInitInfoArgs,
  BaseOracleInitInfoArgs,
  OracleUpdateInfoArgs,
  BaseOracleUpdateInfoArgs
> = {
  fromBase: oracleFromBase,
  initToBase: oracleInitInfoArgsToBase,
  type: 'Oracle',
  updateToBase: oracleUpdateInfoArgsToBase,
}
