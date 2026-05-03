import type { Address } from '@solana/addresses'

import type { BaseRoyalties, BaseRuleSet } from '../generated/index.ts'
import type { BasePlugin } from './types.ts'

export type Royalties = {
  ruleSet: RuleSet
} & Omit<BaseRoyalties, 'ruleSet'>

export type RoyaltiesArgs = Royalties

export type RoyaltiesPlugin = BasePlugin & Royalties

export type RuleSet = BaseRuleSet | UnwrappedRuleSet

export type UnwrappedRuleSet =
  | {
      addresses: Address[]
      type: 'ProgramAllowList'
    }
  | {
      addresses: Address[]
      type: 'ProgramDenyList'
    }
  | {
      type: 'None'
    }

export function royaltiesFromBase(r: BaseRoyalties): Royalties {
  let ruleSet: RuleSet
  if (r.ruleSet.__kind === 'ProgramAllowList') {
    ruleSet = {
      ...r.ruleSet,
      addresses: r.ruleSet.fields[0],
      type: 'ProgramAllowList',
    }
  } else if (r.ruleSet.__kind === 'ProgramDenyList') {
    ruleSet = {
      ...r.ruleSet,
      addresses: r.ruleSet.fields[0],
      type: 'ProgramDenyList',
    }
  } else {
    ruleSet = {
      ...r.ruleSet,
      type: r.ruleSet.__kind,
    }
  }
  return {
    ...r,
    ruleSet,
  }
}

export function royaltiesToBase(r: Royalties): BaseRoyalties {
  return {
    ...r,
    ruleSet: ruleSetToBase(r.ruleSet),
  }
}

export function ruleSetToBase(r: RuleSet): BaseRuleSet {
  const base = r as BaseRuleSet
  if (base.__kind) {
    return r as BaseRuleSet
  }
  const ruleSet = r as UnwrappedRuleSet

  if (ruleSet.type === 'ProgramAllowList' || ruleSet.type === 'ProgramDenyList') {
    return {
      __kind: ruleSet.type,
      fields: [ruleSet.addresses],
    }
  }
  return { __kind: ruleSet.type }
}
