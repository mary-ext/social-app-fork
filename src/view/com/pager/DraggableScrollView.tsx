import {type ComponentPropsWithRef} from 'react'
import {ScrollView, type ViewStyle} from 'react-native'

import {useDraggableScroll} from '#/lib/hooks/useDraggableScrollView'
import {atoms as a} from '#/alf'

type WebViewStyle = ViewStyle & {
  userSelect?: 'none'
}

const webViewStyle = (style: WebViewStyle): ViewStyle => {
  return style
}

export function DraggableScrollView({
  ref,
  style,
  ...props
}: ComponentPropsWithRef<typeof ScrollView>) {
  const {refs} = useDraggableScroll<ScrollView>({
    outerRef: ref,
    cursor: 'grab', // optional, default
  })

  return (
    <ScrollView
      ref={refs}
      style={[style, webViewStyle(a.user_select_none)]}
      horizontal
      {...props}
    />
  )
}
