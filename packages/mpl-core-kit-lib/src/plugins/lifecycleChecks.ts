import { type ExternalCheckResult, HookableLifecycleEvent } from '../generated/index.ts'
import { capitalizeFirstLetter } from '../utils.ts'

//  ExternalCheckResult is a bit array
export enum CheckResult {
  CAN_LISTEN,
  CAN_APPROVE,
  CAN_REJECT,
}

export type LifecycleEvent = 'burn' | 'create' | 'transfer' | 'update'

export const adapterCheckResultToCheckResults = (check: ExternalCheckResult): CheckResult[] => {
  const results: CheckResult[] = []
  if (check.flags & 1) {
    results.push(CheckResult.CAN_LISTEN)
  }
  if (check.flags & 2) {
    results.push(CheckResult.CAN_APPROVE)
  }
  if (check.flags & 4) {
    results.push(CheckResult.CAN_REJECT)
  }
  return results
}

export const checkResultsToAdapterCheckResult = (results: CheckResult[]): ExternalCheckResult => {
  let flags = 0
  results.forEach((result) => {
    switch (result) {
      case CheckResult.CAN_APPROVE:
        flags |= 2
        break
      case CheckResult.CAN_LISTEN:
        flags |= 1
        break
      case CheckResult.CAN_REJECT:
        flags |= 4
        break
      default:
      // Do nothing
    }
  })
  return { flags }
}

export type LifecycleChecks = { [key in LifecycleEvent]?: CheckResult[] }
export type LifecycleChecksContainer = {
  lifecycleChecks?: LifecycleChecks
}

export function hookableLifecycleEventToLifecycleCheckKey(event: HookableLifecycleEvent): keyof LifecycleChecks {
  return HookableLifecycleEvent[event].toLowerCase() as keyof LifecycleChecks
}

export function lifecycleCheckKeyToEnum(key: keyof LifecycleChecks): HookableLifecycleEvent {
  return HookableLifecycleEvent[capitalizeFirstLetter(key) as keyof typeof HookableLifecycleEvent]
}

export function lifecycleChecksFromBase(l: [HookableLifecycleEvent, ExternalCheckResult][]): LifecycleChecks {
  const checks: LifecycleChecks = {}
  l.forEach(([event, check]) => {
    checks[hookableLifecycleEventToLifecycleCheckKey(event)] = adapterCheckResultToCheckResults(check)
  })
  return checks
}

export function lifecycleChecksToBase(l: LifecycleChecks): [HookableLifecycleEvent, ExternalCheckResult][] {
  return Object.keys(l)
    .map((key) => {
      const k = key as keyof LifecycleChecks
      const value = l[k]
      if (value) {
        return [lifecycleCheckKeyToEnum(k), checkResultsToAdapterCheckResult(value)]
      }
      return null
    })
    .filter((x) => x !== null) as [HookableLifecycleEvent, ExternalCheckResult][]
}
