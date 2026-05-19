import {useCallback, useState} from 'react'
import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function ComposerPrompt() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()
  const profile = useCurrentAccountProfile()
  const [hover, setHover] = useState(false)

  const onPress = useCallback(() => {
    openComposer({logContext: 'Fab'})
  }, [openComposer])

  const onPressImage = useCallback(async () => {
    openComposer({openGallery: true, logContext: 'Fab'})
    return
  }, [openComposer])

  if (!profile) {
    return null
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      accessibilityRole="button"
      accessibilityLabel={l`Compose new post`}
      accessibilityHint={l`Opens the post composer`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={({pressed}) => [
        a.relative,
        a.flex_row,
        a.align_start,
        {
          paddingLeft: 18,
          paddingRight: 15,
        },
        a.py_md,
        undefined as any,
        {
          cursor: 'pointer',
          outline: 'none',
        } as any,
        pressed && ({outline: 'none'} as any),
      ]}>
      <SubtleHover hover={hover} />
      <UserAvatar
        avatar={profile.avatar}
        size={42}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
      />
      <View
        style={[
          a.flex_1,
          a.ml_md,
          a.flex_row,
          a.align_center,
          a.justify_between,
          {
            height: 40,
          },
        ]}>
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.text_md,
            {includeFontPadding: false},
          ]}>
          <Trans>What's up?</Trans>
        </Text>
        <View style={[a.flex_row, a.gap_md]}>
          <Button
            onPress={e => {
              e.stopPropagation()
              onPressImage()
            }}
            label={l`Add image`}
            accessibilityHint={l`Opens image picker`}
            variant="ghost"
            shape="round">
            {({hovered, pressed, focused}) => (
              <ImageIcon
                size="lg"
                style={{
                  color:
                    hovered || pressed || focused
                      ? t.palette.primary_500
                      : t.palette.contrast_300,
                }}
              />
            )}
          </Button>
        </View>
      </View>
    </Pressable>
  )
}
