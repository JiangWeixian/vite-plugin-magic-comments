// Copyright [CaptainLiao](https://github.com/CaptainLiao)

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { HtmlTagDescriptor, Plugin, splitVendorChunk } from 'vite'
import type { ManualChunksOption } from 'rollup'
import { init } from 'es-module-lexer'
import type { ImportSpecifier } from 'es-module-lexer'
import MagicString from 'magic-string'
import { withLeadingSlash } from 'ufo'
import Debug from 'debug'

import { parseImports, formatChunkName } from '../node/utils'

type GetManualChunk = ReturnType<typeof splitVendorChunk>
const ALLOW_MAGIC_COMMENTS = new Set([
  'webpackChunkName',
  'webpackPreload',
  'webpackPrefetch',
  'chunkName',
  'preload',
  'prefetch',
])
export const magicCommentsQueryRE =
  /(?:\?|&)(webpackC|c)hunkName|(webpackP|p)reload|(webpackP|p)refetch\b/
export const magicCommentRE =
  /(?:\/\*\s)((webpackC|c)hunkName|(webpackP|p)reload|(webpackP|p)refetch)(:\s)/

const debug = Debug('magicComments')

/**
 * Call user defined functions that may be defined
 * at `build.rollupOptions.output` before calling
 * `manualChunksConfig`.
 */
function getManualChunks(
  initialManualChunks: ManualChunksOption | undefined,
  builtInManualChunks: GetManualChunk,
): GetManualChunk {
  const userDefinedManualChunks =
    typeof initialManualChunks === 'function' ? initialManualChunks : undefined
  return (id, opts) => {
    if (userDefinedManualChunks) {
      const result = userDefinedManualChunks(id, opts as any)
      if (result) {
        debug('chunk file %s user defined chunkname %s', id, result)
        return result
      }
    }
    return builtInManualChunks(id, opts)
  }
}

/**
 * Vite plugin development docs
 * @see {@link https://vitejs.dev/guide/api-plugin.html}
 * Rollup lifetime hooks
 * @see {@link https://github.com/neo-hack/rollup-plugin-template/blob/master/src/index.ts}
 */
export const magicComments = (): Plugin => {
  const magicCommentsMetaData = new Map<string, { preload: boolean; prefetch: boolean }>()
  return {
    name: 'magicComments',
    enforce: 'post',
    async options() {
      await init
    },
    async transform(source) {
      const hasMagicComments = magicCommentRE.test(source)
      if (!hasMagicComments) return
      const [imports] = parseImports(source)
      let str = new MagicString(source)
      // map importer to import info(parsed by es-module-lexer) & query(preload & prefetch info)
      const specifierInfoMap = new Map<
        string,
        { specifier: ImportSpecifier; search: Record<string, string> }
      >()
      // parse comment meta info
      for (const specifier of imports) {
        const s = source.slice(specifier.ss, specifier.se)
        const id = specifier.n
        if (id && s.includes('/*')) {
          this.parse(s, {
            onComment(isComment: false, comment: string) {
              if (!isComment) {
                return
              }
              const [key, value] = comment.trimEnd().split(':')
              if (!ALLOW_MAGIC_COMMENTS.has(key.trim())) {
                return
              }
              let result = specifierInfoMap.get(id)
              if (!result) {
                result = { specifier, search: {} }
              }
              result = {
                ...result,
                search: {
                  ...result.search,
                  [key.trim()]: value.trim(),
                },
              }
              debug('importer %s comment meta info %o', id, result)
              specifierInfoMap.set(id, result)
            },
          })
        }
      }
      // add comment into query
      for (const info of specifierInfoMap.values()) {
        const { specifier, search } = info
        const params = new URLSearchParams(search)
        const importer = `"${specifier.n}?${params.toString()}"`
        str = str.overwrite(specifier.s, specifier.e, importer)
      }
      // TODO: should add sourcemap info?
      return {
        code: str.toString(),
      }
    },
    async renderChunk(_code, chunk) {
      const moduleIds = Object.keys(chunk.modules)
      const id = moduleIds[moduleIds.length - 1]
      if (magicCommentsQueryRE.test(id)) {
        const [, query] = id.split('?')
        const search = new URLSearchParams(query)
        // save meta info, process later in transform html
        debug('save chunk file %s meta info %s', id, search.toString())
        // map chunkname to preload & prefetch meta info
        magicCommentsMetaData.set(chunk.fileName, {
          preload: !!(search.get('webpackPreload') ?? search.get('preload')),
          prefetch: !!(search.get('webpackPrefetch') ?? search.get('prefetch')),
        })
      }
      return null
    },
    async transformIndexHtml(html) {
      const htmlTags: HtmlTagDescriptor[] = []
      debug('set chunks meta info %o on html', magicCommentsMetaData)
      // add preload & prefetch links into head
      for (const [fileName, meta] of magicCommentsMetaData.entries()) {
        htmlTags.push({
          tag: 'link',
          attrs: {
            href: withLeadingSlash(fileName),
            preload: meta.preload ? JSON.stringify(meta.preload) : undefined,
            prefetch: meta.prefetch ? JSON.stringify(meta.prefetch) : undefined,
          },
        })
      }
      return {
        html,
        tags: htmlTags,
      }
    },
    config(userConfig) {
      if (!userConfig.build) userConfig.build = {}
      if (!userConfig.build.rollupOptions) userConfig.build.rollupOptions = {}
      if (!userConfig.build.rollupOptions.output) userConfig.build.rollupOptions.output = {}

      const manualChunks: GetManualChunk = (id) => {
        if (magicCommentsQueryRE.test(id)) {
          const [, query] = id.split('?')
          const search = new URLSearchParams(query)
          const chunkName = search.get('webpackChunkName') ?? search.get('chunkName')
          return formatChunkName(chunkName ?? undefined) || null
        }
        return null
      }

      const rollupOptions = userConfig.build.rollupOptions
      const output = rollupOptions.output
      if (Array.isArray(output)) {
        rollupOptions.output = output.map((item) => {
          item.manualChunks = getManualChunks(item?.manualChunks, manualChunks)
          return item
        })
      } else {
        Object.assign(userConfig.build.rollupOptions.output, {
          manualChunks: getManualChunks(output?.manualChunks, manualChunks),
        })
      }
    },
  }
}
