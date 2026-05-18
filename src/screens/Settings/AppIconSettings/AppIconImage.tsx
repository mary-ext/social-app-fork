import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'
import {atoms as a, platform, useTheme} from '#/alf'
import {Image} from '#/shims/image'

export function AppIconImage({
  icon,
  size = 50,
}: {
  icon: AppIconSet
  size: number
}) {
  const t = useTheme()
  return (
    <Image
      source={platform({
        ios: icon.iosImage(),
        android: icon.androidImage(),
      })}
      style={[
        {width: size, height: size},
        platform({
          ios: {borderRadius: size / 5},
          android: a.rounded_full,
        }),
        a.curve_continuous,
        t.atoms.border_contrast_medium,
        a.border,
      ]}
      accessibilityIgnoresInvertColors
    />
  )
}
