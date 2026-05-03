import type { BaseValidationResultsOffset } from '../generated/index.ts'

export type ValidationResultsOffset = { offset: bigint; type: 'Custom' } | { type: 'Anchor' } | { type: 'NoOffset' }

export function validationResultsOffsetFromBase(e: BaseValidationResultsOffset): ValidationResultsOffset {
  if (e.__kind === 'Custom') {
    return {
      offset: e.fields[0],
      type: 'Custom',
    }
  }

  return {
    type: e.__kind,
  }
}

export function validationResultsOffsetToBase(e: ValidationResultsOffset): BaseValidationResultsOffset {
  if (e.type === 'Custom') {
    return {
      __kind: 'Custom',
      fields: [e.offset],
    }
  }

  return {
    __kind: e.type,
  }
}
