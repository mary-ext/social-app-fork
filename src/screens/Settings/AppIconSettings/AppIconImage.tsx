import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'
import { atoms as a, useTheme } from '#/alf';
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
      source={undefined}
      style={[
        {width: size, height: size},
        undefined,
        a.curve_continuous,
        t.atoms.border_contrast_medium,
        a.border,
      ]}
      accessibilityIgnoresInvertColors
    />
  );
}
