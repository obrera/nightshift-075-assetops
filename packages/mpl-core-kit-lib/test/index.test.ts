import { describe, expect, test } from 'bun:test'

import { MPL_CORE_PROGRAM_ADDRESS } from '../src/index.ts'

describe('mpl-core-kit-lib', () => {
  test('exports the mpl core program address', () => {
    expect(MPL_CORE_PROGRAM_ADDRESS).toBeDefined()
  })
})
