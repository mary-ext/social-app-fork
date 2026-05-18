import {useCallback, useState} from 'react'
import {Pressable, TextInput, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import Animated, {
  measure,
  runOnJS,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from '#/lib/animations/reanimatedCompat'
import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import { atoms as a, tokens, useTheme } from '#/alf';
import {GlassView} from '#/components/GlassView'
import {PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import * as Toast from '#/components/Toast'
import {GlassContainer} from '#/shims/glass-effect'
import {
  useFocusedInputHandler,
  useKeyboardHandler,
  useReanimatedKeyboardAnimation,
} from '#/shims/native-keyboard-controller'
import {ComposerContainer} from './MessageComposer'
import {useExtractEmbedFromFacets} from './MessageInputEmbed'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const MIN_HEIGHT = 40

export function MessageInput({
  textInputId,
  onSendMessage,
  hasEmbed,
  setEmbed,
  children,
}: {
  textInputId?: string
  onSendMessage: (message: string) => Promise<void> | void
  hasEmbed: boolean
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {getDraft, clearDraft} = useMessageDraft()

  // Input layout
  const {top: topInset} = useSafeAreaInsets()
  const {height: windowHeight} = useWindowDimensions()
  const {height: keyboardHeight} = useReanimatedKeyboardAnimation()
  const maxHeight = useSharedValue<undefined | number>(undefined)
  const isInputScrollable = useSharedValue(false)

  const [message, setMessage] = useState(getDraft)
  const inputRef = useAnimatedRef<TextInput>()
  const [shouldEnforceClear, setShouldEnforceClear] = useState(false)

  useSaveMessageDraft(message)
  useExtractEmbedFromFacets(message, setEmbed)

  const onSubmit = useCallback(() => {
    if (!hasEmbed && message.trim() === '') {
      return
    }
    if (countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(l`Message is too long`, {
        type: 'error',
      })
      return
    }
    clearDraft()
    playHaptic()
    setEmbed(undefined)
    setMessage('')
    // Pressing the send button causes the text input to lose focus, so we need to
    // re-focus it after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    requestAnimationFrame(() => {
      void onSendMessage(message)
    })
  }, [
    hasEmbed,
    message,
    clearDraft,
    onSendMessage,
    playHaptic,
    setEmbed,
    inputRef,
    l,
  ])

  useFocusedInputHandler(
    {
      onChangeText: () => {
        'worklet'
        const measurement = measure(inputRef)
        if (!measurement) return

        const max = windowHeight - -keyboardHeight.get() - topInset - 150
        const availableSpace = max - measurement.height

        maxHeight.set(max)
        isInputScrollable.set(availableSpace < 30)
      },
    },
    [windowHeight, topInset],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.get(),
  }))

  const animatedProps = useAnimatedProps(() => ({
    scrollEnabled: isInputScrollable.get(),
  }))

  const submitDisabled = !hasEmbed && message.trim().length === 0

  const blur = useCallback(() => {
    inputRef.current?.blur()
  }, [inputRef])

  useKeyboardHandler({
    onEnd: evt => {
      'worklet';
    },
  })

  return (
    <ComposerContainer>
      {children}
      <GlassContainer
        style={[a.flex_row, a.align_end, a.gap_sm]}
        spacing={tokens.space.xs}>
        <GlassView
          isInteractive
          glassEffectStyle="regular"
          style={[a.flex_1, a.rounded_xl, {minHeight: MIN_HEIGHT}]}
          tintColor={t.palette.contrast_50}
          fallbackStyle={[t.atoms.bg_contrast_50]}>
          <AnimatedTextInput
            nativeID={textInputId}
            accessibilityLabel={l`Message input field`}
            accessibilityHint={l`Type your message here`}
            placeholder={l`Message`}
            placeholderTextColor={t.palette.contrast_500}
            value={message}
            onChange={evt => {
              const text = evt.nativeEvent.text
              setMessage(text)
            }}
            multiline={true}
            style={[
              {flexBasis: 'auto', minHeight: MIN_HEIGHT},
              a.flex_shrink_0,
              a.flex_grow,
              a.text_md,
              a.px_lg,
              t.atoms.text,
              undefined,
              animatedStyle,
            ]}
            verticalAlign="middle"
            keyboardAppearance={t.scheme}
            submitBehavior="newline"
            ref={inputRef}
            hitSlop={HITSLOP_10}
            animatedProps={animatedProps}
          />
        </GlassView>
        <GlassView
          isInteractive
          glassEffectStyle="regular"
          style={[a.rounded_full]}
          tintColor={
            submitDisabled ? t.palette.contrast_100 : t.palette.primary_500
          }
          fallbackStyle={{
            backgroundColor: submitDisabled
              ? t.palette.contrast_100
              : t.palette.primary_500,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={l`Send message`}
            accessibilityHint=""
            hitSlop={HITSLOP_10}
            style={[
              a.rounded_full,
              a.align_center,
              a.justify_center,
              {
                height: MIN_HEIGHT,
                width: MIN_HEIGHT,
              },
            ]}
            onPress={onSubmit}
            disabled={submitDisabled}>
            <PaperPlaneIcon
              size="md"
              fill={t.palette.white}
              style={[a.mb_2xs]}
            />
          </Pressable>
        </GlassView>
      </GlassContainer>
    </ComposerContainer>
  );
}
