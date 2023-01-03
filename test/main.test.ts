import { describe, it, expect } from 'vitest'

import { formatChunkName } from '../src/node/utils'
import { magicCommentRE } from '../src/exports'

describe('format', () => {
  it('format chunkname', () => {
    expect(formatChunkName(`"my-chunk-name"`)).toBe('my-chunk-name')
  })
})

describe('regex', () => {
  it('magic comments', () => {
    const code = `
    import(
      /* webpackPreload: true */
      /* webpackPrefetch: true */
      /* webpackChunkName: my-chunk-name */
      "module"
    )
    `
    expect(magicCommentRE.test(code)).toBe(true)
  })

  it('magic query', () => {
    const code = `
    import("module?webpackChunkName=my-chunk-name")
    `
    expect(magicCommentRE.test(code)).toBe(true)
  })
})
