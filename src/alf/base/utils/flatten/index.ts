import {type StyleProp} from 'react-native'

export const flatten = <T>(
  style: StyleProp<T>,
): T extends (infer U)[] ? U : T => {
  const defs = Array.isArray(style) ? style : [style]
  return Object.assign({}, ...defs.filter(Boolean).flat())
}
