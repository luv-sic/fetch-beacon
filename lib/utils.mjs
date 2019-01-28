/**
 * Get the raw type string of a value, e.g., [object Object].
 */
const _toString = Object.prototype.toString

export function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

export const isString = (val) => toRawType(val) === 'String';