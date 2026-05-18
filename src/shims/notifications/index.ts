export type DevicePushToken = {
  type: string
  data: string
}

export type Notification = {
  date: number
  request: {
    identifier: string
    trigger: {
      type?: string
      channelId?: string
      payload?: string
    } | null
    content: {
      data?: Record<string, unknown>
    }
  }
}

export type NotificationResponse = {
  actionIdentifier: string
  notification: Notification
}

export type NotificationBehavior = {
  shouldPlaySound?: boolean
  shouldSetBadge?: boolean
  shouldShowAlert?: boolean
  shouldShowBanner?: boolean
  shouldShowList?: boolean
}

export const DEFAULT_ACTION_IDENTIFIER = 'default'

export enum AndroidImportance {
  DEFAULT = 3,
  HIGH = 4,
  MAX = 5,
}

export enum AndroidNotificationVisibility {
  PRIVATE = 0,
}

type Subscription = {
  remove: () => void
}

type NotificationHandler = {
  handleNotification: (
    notification: Notification,
  ) => Promise<NotificationBehavior>
}

const subscription: Subscription = {remove: () => {}}

export async function getPermissionsAsync() {
  return {granted: false, canAskAgain: false, status: 'denied'}
}

export async function requestPermissionsAsync() {
  return getPermissionsAsync()
}

export async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  return {type: 'web', data: ''}
}

export function addPushTokenListener(
  _listener?: (token: DevicePushToken) => void,
): Subscription {
  return subscription
}

export function addNotificationResponseReceivedListener(
  _listener?: (event: NotificationResponse) => void,
): Subscription {
  return subscription
}

export function setNotificationHandler(_handler?: NotificationHandler): void {}
export async function setNotificationChannelGroupAsync(
  _id?: string,
  _options?: unknown,
): Promise<void> {}
export async function setNotificationChannelAsync(
  _id?: string,
  _options?: unknown,
): Promise<void> {}
export async function dismissAllNotificationsAsync(): Promise<void> {}
export async function getBadgeCountAsync(): Promise<number> {
  return 0
}
export async function setBadgeCountAsync(_count?: number): Promise<boolean> {
  return true
}
export function getLastNotificationResponse(): NotificationResponse | null {
  return null
}
export function clearLastNotificationResponse(): void {}
