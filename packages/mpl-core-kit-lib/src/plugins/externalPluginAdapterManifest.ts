import type { ExternalRegistryRecord } from '../generated/index.ts'
import type { ExternalPluginAdapterTypeString } from './externalPluginAdapters.ts'

export type ExternalPluginAdapterManifest<
  T extends object,
  Base extends object,
  Init extends object,
  InitBase extends object,
  Update extends object,
  UpdateBase extends object,
> = {
  fromBase: (input: Base, record: ExternalRegistryRecord, account: Uint8Array) => T
  initToBase: (input: Init) => InitBase
  type: ExternalPluginAdapterTypeString
  updateToBase: (input: Update) => UpdateBase
}
