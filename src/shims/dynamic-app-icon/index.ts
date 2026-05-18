export type IconName = string

export function getAppIcon(): IconName | false {
  return false
}

export function setAppIcon(icon: IconName | null): IconName | false {
  return icon ?? false
}
