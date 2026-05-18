export type ExternalToast = {
  dismissible?: boolean
  duration?: number
  id?: string
  promiseOptions?: unknown
}

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

/**
 * Not all properties are available on all platforms, so we pick out only those
 * we support. Add more here as needed.
 */
export type BaseToastOptions = Pick<
  ExternalToast,
  'duration' | 'dismissible' | 'id' | 'promiseOptions'
> & {
  type?: ToastType

  /**
   * These methods differ between web/native implementations
   */
  onDismiss?: () => void
  onPress?: () => void
  onAutoClose?: () => void
}
