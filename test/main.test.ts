import { describe, it, expect } from 'vitest'

import { formatChunkName } from '../src/node/utils'

describe('format', () => {
  it('format chunkname', () => {
    expect(formatChunkName(`"my-chunk-name"`)).toBe('my-chunk-name')
  })
})
