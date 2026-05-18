/* eslint-disable @typescript-eslint/no-explicit-any */

export const isWeb = true

type PlatformSpecifics = {
  web?: any
  ios?: any
  android?: any
  native?: any
  default?: any
}

export const web = <T>(value: T): any => value

export const ios = <T>(_value: T): any => undefined

export const android = <T>(_value: T): any => undefined

export const native = <T>(_value: T): any => undefined

export function platform<_T = any>(specifics: PlatformSpecifics): any {
  return specifics.web ?? specifics.default
}
