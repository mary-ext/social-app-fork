import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {KeyboardStickyView} from '#/shims/native-keyboard-controller'

export function KeyboardAccessory({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {bottom} = useSafeAreaInsets()

  const style = [
    a.flex_row,
    a.py_xs,
    a.pl_sm,
    a.pr_xl,
    a.align_center,
    a.border_t,
    t.atoms.border_contrast_medium,
    t.atoms.bg,
  ]

  return <View style={style}>{children}</View>
}
