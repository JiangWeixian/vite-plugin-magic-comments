import { parse } from 'es-module-lexer'
// eslint-disable-next-line import/no-extraneous-dependencies
import { trim } from 'lodash-es'

export const parseImports = (source: string) => {
  try {
    return parse(source)
  } catch (e) {
    console.error(e)
    return []
  }
}

export const formatChunkName = (chunkName = '') => {
  return trim(chunkName, '"')
}
