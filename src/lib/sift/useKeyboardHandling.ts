import {type UseSiftReturn} from './useSift'

export function useKeyboardHandling(_props: {
  enabled?: boolean
  sift: UseSiftReturn
  onArrowDown: () => void
  onArrowUp: () => void
  onHome: () => void
  onEnd: () => void
  onSelect: () => void
  onDismiss?: () => void
}) {}
