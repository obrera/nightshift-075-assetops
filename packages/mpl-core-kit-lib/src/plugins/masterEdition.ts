import type { BaseMasterEdition } from '../generated/index.ts'
import { someOrNone, unwrapOption } from '../utils.ts'

export type MasterEdition = {
  maxSupply?: number
  name?: string
  uri?: string
}

export type MasterEditionArgs = MasterEdition

export function masterEditionFromBase(s: BaseMasterEdition): MasterEdition {
  return {
    maxSupply: unwrapOption(s.maxSupply),
    name: unwrapOption(s.name),
    uri: unwrapOption(s.uri),
  }
}

export function masterEditionToBase(s: MasterEdition): BaseMasterEdition {
  return {
    maxSupply: someOrNone(s.maxSupply),
    name: someOrNone(s.name),
    uri: someOrNone(s.uri),
  }
}
