import type {
  AddBlocker,
  Attributes,
  AttributesArgs,
  Autograph,
  AutographArgs,
  BaseMasterEditionArgs,
  BasePluginAuthority,
  BaseRoyaltiesArgs,
  BubblegumV2,
  BurnDelegate,
  Edition,
  EditionArgs,
  FreezeDelegate,
  FreezeDelegateArgs,
  FreezeExecute,
  FreezeExecuteArgs,
  ImmutableMetadata,
  PermanentBurnDelegate,
  PermanentFreezeDelegate,
  PermanentFreezeDelegateArgs,
  PermanentFreezeExecute,
  PermanentFreezeExecuteArgs,
  PermanentTransferDelegate,
  TransferDelegate,
  UpdateDelegate,
  UpdateDelegateArgs,
  VerifiedCreators,
  VerifiedCreatorsArgs,
} from '../generated/index.ts'
import type { MasterEdition, MasterEditionArgs } from './masterEdition.ts'
import type { PluginAuthority } from './pluginAuthority.ts'
import type { RoyaltiesArgs, RoyaltiesPlugin } from './royalties.ts'

export type AddBlockerPlugin = AddBlocker & BasePlugin

export type AssetAddablePluginArgsV2 = AuthorityManagedPluginArgsV2 | OwnerManagedPluginArgsV2
export type AssetAddablePluginAuthorityPairArgsV2 = AssetAddablePluginArgsV2 & AuthorityArgsV2
export type AssetAllPluginArgsV2 = AssetAddablePluginArgsV2 | CreateOnlyPluginArgsV2
export type AssetPluginAuthorityPairArgsV2 = AssetAllPluginArgsV2 & AuthorityArgsV2
export type AssetPluginsList = {
  burnDelegate?: BurnDelegatePlugin
  edition?: EditionPlugin
  freezeDelegate?: FreezeDelegatePlugin
  transferDelegate?: TransferDelegatePlugin
} & CommonPluginsList
export type AttributesPlugin = Attributes & BasePlugin
export type AuthorityArgsV2 = {
  authority?: PluginAuthority
}
export type AuthorityManagedPluginArgsV2 =
  | {
      type: 'AddBlocker'
    }
  | ({
      type: 'Attributes'
    } & AttributesArgs)
  | {
      type: 'ImmutableMetadata'
    }
  | ({
      type: 'MasterEdition'
    } & MasterEditionArgs)
  | ({
      type: 'Royalties'
    } & RoyaltiesArgs)
  | ({
      type: 'UpdateDelegate'
    } & UpdateDelegateArgs)
  | ({
      type: 'VerifiedCreators'
    } & VerifiedCreatorsArgs)
export type AutographPlugin = Autograph & BasePlugin
export type BasePlugin = {
  authority: PluginAuthority
  offset?: bigint
}
export type BubblegumV2Plugin = BasePlugin & BubblegumV2
export type BurnDelegatePlugin = BasePlugin & BurnDelegate
export type CollectionAddablePluginArgsV2 = AuthorityManagedPluginArgsV2
export type CollectionAddablePluginAuthorityPairArgsV2 = AuthorityArgsV2 & CollectionAddablePluginArgsV2
export type CollectionAllPluginArgsV2 = CollectionAddablePluginArgsV2 | CreateOnlyPluginArgsV2
export type CollectionPluginAuthorityPairArgsV2 = AuthorityArgsV2 & CollectionAllPluginArgsV2
export type CollectionPluginsList = {
  bubblegumV2?: BubblegumV2Plugin
  masterEdition?: MasterEditionPlugin
} & CommonPluginsList

export type CommonPluginsList = {
  addBlocker?: AddBlockerPlugin
  attributes?: AttributesPlugin
  autograph?: AutographPlugin
  freezeExecute?: FreezeExecutePlugin
  immutableMetadata?: ImmutableMetadataPlugin
  permanentBurnDelegate?: PermanentBurnDelegatePlugin
  permanentFreezeDelegate?: PermanentFreezeDelegatePlugin
  permanentFreezeExecute?: PermanentFreezeExecutePlugin
  permanentTransferDelegate?: PermanentTransferDelegatePlugin
  royalties?: RoyaltiesPlugin
  updateDelegate?: UpdateDelegatePlugin
  verifiedCreators?: VerifiedCreatorsPlugin
}

export type CreateOnlyPluginArgsV2 =
  | {
      type: 'BubblegumV2'
    }
  | ({
      type: 'Edition'
    } & EditionArgs)
  | {
      type: 'PermanentBurnDelegate'
    }
  | ({
      type: 'PermanentFreezeDelegate'
    } & PermanentFreezeDelegateArgs)
  | ({
      type: 'PermanentFreezeExecute'
    } & PermanentFreezeExecuteArgs)
  | {
      type: 'PermanentTransferDelegate'
    }

export type CreatePluginArgs =
  | {
      data: AttributesArgs
      type: 'Attributes'
    }
  | {
      data: AutographArgs
      type: 'Autograph'
    }
  | {
      data: BaseMasterEditionArgs
      type: 'MasterEdition'
    }
  | {
      data: BaseRoyaltiesArgs
      type: 'Royalties'
    }
  | {
      data: EditionArgs
      type: 'Edition'
    }
  | {
      data: FreezeDelegateArgs
      type: 'FreezeDelegate'
    }
  | {
      data: FreezeExecuteArgs
      type: 'FreezeExecute'
    }
  | {
      data: PermanentFreezeDelegateArgs
      type: 'PermanentFreezeDelegate'
    }
  | {
      data: PermanentFreezeExecuteArgs
      type: 'PermanentFreezeExecute'
    }
  | {
      data: VerifiedCreatorsArgs
      type: 'VerifiedCreators'
    }
  | {
      data?: UpdateDelegateArgs
      type: 'UpdateDelegate'
    }
  | {
      type: 'AddBlocker'
    }
  | {
      type: 'BubblegumV2'
    }
  | {
      type: 'BurnDelegate'
    }
  | {
      type: 'ImmutableMetadata'
    }
  | {
      type: 'PermanentBurnDelegate'
    }
  | {
      type: 'PermanentTransferDelegate'
    }
  | {
      type: 'TransferDelegate'
    }

export type EditionPlugin = BasePlugin & Edition

// Note: RoyaltiesPlugin is defined in royalties.ts with a more sophisticated type
export type FreezeDelegatePlugin = BasePlugin & FreezeDelegate

export type FreezeExecutePlugin = BasePlugin & FreezeExecute

export type ImmutableMetadataPlugin = BasePlugin & ImmutableMetadata

export type MasterEditionPlugin = BasePlugin & MasterEdition

export type OwnerManagedPluginArgsV2 =
  | ({
      type: 'Autograph'
    } & AutographArgs)
  | {
      type: 'BurnDelegate'
    }
  | ({
      type: 'FreezeDelegate'
    } & FreezeDelegateArgs)
  | ({
      type: 'FreezeExecute'
    } & FreezeExecuteArgs)
  | {
      type: 'TransferDelegate'
    }

export type PermanentBurnDelegatePlugin = BasePlugin & PermanentBurnDelegate

export type PermanentFreezeDelegatePlugin = BasePlugin & PermanentFreezeDelegate
export type PermanentFreezeExecutePlugin = BasePlugin & PermanentFreezeExecute
export type PermanentTransferDelegatePlugin = BasePlugin & PermanentTransferDelegate
export type PluginAuthorityPairHelperArgs = {
  authority?: BasePluginAuthority | PluginAuthority
} & CreatePluginArgs

export type PluginsList = AssetPluginsList & CollectionPluginsList
export type TransferDelegatePlugin = BasePlugin & TransferDelegate
export type UpdateDelegatePlugin = BasePlugin & UpdateDelegate
export type VerifiedCreatorsPlugin = BasePlugin & VerifiedCreators
