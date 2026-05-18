import {getAge} from '#/lib/strings/time'

export const MIN_ACCESS_AGE = 13

export function isUnderAge(birthDate: string, age: number) {
  return getAge(new Date(birthDate)) < age
}
