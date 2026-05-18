import {createContext} from 'react'
import {View} from 'react-native'

type DrawerGesture = {
  activeOffsetX: (value: number | [number, number]) => DrawerGesture
  failOffsetX: (value: number | [number, number]) => DrawerGesture
  failOffsetY: (value: number | [number, number]) => DrawerGesture
  requireExternalGestureToFail: (gesture: unknown) => DrawerGesture
}

export const DrawerGestureContext = createContext<DrawerGesture | undefined>(
  undefined,
)

type DrawerProps = React.ComponentProps<typeof View> & {
  configureGestureHandler?: (handler: DrawerGesture) => unknown
  drawerType?: 'front' | 'back' | 'slide' | 'permanent'
  drawerStyle?: React.ComponentProps<typeof View>['style']
  onClose?: () => void
  onOpen?: () => void
  open?: boolean
  overlayStyle?: React.ComponentProps<typeof View>['style']
  renderDrawerContent?: () => React.ReactNode
  swipeEdgeWidth?: number
  swipeMinDistance?: number
  swipeMinVelocity?: number
}

export function Drawer({
  children,
  configureGestureHandler,
  drawerType,
  drawerStyle,
  onClose,
  onOpen,
  open,
  overlayStyle,
  renderDrawerContent,
  swipeEdgeWidth,
  swipeMinDistance,
  swipeMinVelocity,
  ...props
}: DrawerProps) {
  void configureGestureHandler
  void drawerType
  void drawerStyle
  void onClose
  void onOpen
  void open
  void overlayStyle
  void renderDrawerContent
  void swipeEdgeWidth
  void swipeMinDistance
  void swipeMinVelocity
  return <View {...props}>{children}</View>
}
