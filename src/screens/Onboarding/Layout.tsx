import {useEffect, useRef, useState} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Trans,useLingui} from '@lingui/react/macro'

import {useOnboardingDispatch} from '#/state/shell'
import {useOnboardingInternalState} from '#/screens/Onboarding/state'
import { atoms as a, type TextStyleProp, tokens, useBreakpoints, useTheme } from '#/alf';
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {HEADER_SLOT_SIZE} from '#/components/Layout'
import {createPortalGroup} from '#/components/Portal'
import {P, Text} from '#/components/Typography'
import { IS_INTERNAL } from '#/env';

const ONBOARDING_COL_WIDTH = 420

export const OnboardingControls = createPortalGroup()
export const OnboardingHeaderSlot = createPortalGroup()

export function Layout({children}: React.PropsWithChildren<{}>) {
  const {t: l} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const onboardDispatch = useOnboardingDispatch()
  const {state, dispatch} = useOnboardingInternalState()
  const scrollview = useRef<ScrollView>(null)
  const prevActiveStep = useRef<string>(state.activeStep)

  useEffect(() => {
    if (state.activeStep !== prevActiveStep.current) {
      prevActiveStep.current = state.activeStep
      scrollview.current?.scrollTo({y: 0, animated: false})
    }
  }, [state])

  const dialogLabel = l`Set up your account`

  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  return (
    <View
      aria-modal
      role="dialog"
      aria-role="dialog"
      aria-label={dialogLabel}
      accessibilityLabel={dialogLabel}
      accessibilityHint={l`Customizes your Bluesky experience`}
      style={[a.fixed, a.inset_0, a.flex_1, t.atoms.bg]}>
      {!gtMobile ? (
        <View
          style={[
            a.fixed,
            undefined as any,
            a.top_0,
            a.left_0,
            a.right_0,
            a.flex_row,
            a.w_full,
            a.justify_center,
            a.z_20,
            a.px_xl,
            {paddingTop: (tokens.space.lg ?? 0) + insets.top},
            undefined as any,
            a.pointer_events_box_none,
          ]}
          onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}>
          <View
            style={[
              a.w_full,
              a.align_center,
              a.flex_row,
              a.justify_between,
              {maxWidth: ONBOARDING_COL_WIDTH} as any,
              a.pointer_events_box_none,
            ]}>
            <HeaderSlot>
              {state.canGoBack && (
                <Button
                  key={state.activeStep} // remove focus state on nav
                  color="secondary"
                  variant="ghost"
                  shape="round"
                  size="small"
                  label={l`Go back to previous step`}
                  onPress={() => dispatch({type: 'prev'})}>
                  <ButtonIcon icon={ArrowLeft} size="lg" />
                </Button>
              )}
            </HeaderSlot>

            {IS_INTERNAL && (
              <Button
                variant="ghost"
                color="negative"
                size="tiny"
                onPress={() => onboardDispatch({type: 'skip'})}
                // DEV ONLY
                label="Clear onboarding state">
                <ButtonText>[DEV] Clear</ButtonText>
              </Button>
            )}

            <HeaderSlot>
              <OnboardingHeaderSlot.Outlet />
            </HeaderSlot>
          </View>
        </View>
      ) : (
        <>
          {IS_INTERNAL && (
            <View
              style={[
                a.absolute,
                a.align_center,
                a.z_10,
                {top: 0, left: 0, right: 0},
              ]}>
              <Button
                variant="ghost"
                color="negative"
                size="tiny"
                onPress={() => onboardDispatch({type: 'skip'})}
                // DEV ONLY
                label="Clear onboarding state">
                <ButtonText>[DEV] Clear</ButtonText>
              </Button>
            </View>
          )}
        </>
      )}
      <ScrollView
        ref={scrollview}
        style={[a.h_full, a.w_full]}
        contentContainerStyle={{
          borderWidth: 0,
          minHeight: '100%',
          paddingTop: gtMobile ? 40 : headerHeight,
          paddingBottom: footerHeight,
        }}
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{bottom: footerHeight - insets.bottom}}
        // @ts-expect-error web only --prf
        dataSet={{'stable-gutters': 1}}
        centerContent={gtMobile}>
        <View
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: ONBOARDING_COL_WIDTH} as any]}>
            <View style={[a.w_full, a.py_md]}>{children}</View>
          </View>
        </View>
      </ScrollView>
      <View
        onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}
        style={[
          a.fixed,
          {bottom: 0, left: 0, right: 0},
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.border_t,
          a.align_center,
          gtMobile ? a.px_5xl : a.px_xl,
          a.py_2xl,
        ]}>
        <View
          style={[
            a.w_full,
            {maxWidth: ONBOARDING_COL_WIDTH},
            gtMobile && [a.flex_row, a.justify_between, a.align_center],
          ]}>
          {gtMobile &&
            (state.canGoBack ? (
              <Button
                key={state.activeStep} // remove focus state on nav
                color="secondary"
                variant="ghost"
                shape="square"
                size="small"
                label={l`Go back to previous step`}
                onPress={() => dispatch({type: 'prev'})}>
                <ButtonIcon icon={ArrowLeft} size="lg" />
              </Button>
            ) : (
              <View style={{height: 33}} />
            ))}
          <OnboardingControls.Outlet />
        </View>
      </View>
    </View>
  );
}

function HeaderSlot({children}: {children?: React.ReactNode}) {
  return (
    <View style={[{minHeight: HEADER_SLOT_SIZE, minWidth: HEADER_SLOT_SIZE}]}>
      {children}
    </View>
  )
}

export function OnboardingPosition() {
  const {state} = useOnboardingInternalState()
  const t = useTheme()

  return (
    <Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
      <Trans>
        Step {state.activeStepIndex + 1} of {state.totalSteps}
      </Trans>
    </Text>
  )
}

export function OnboardingTitleText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  return (
    <Text style={[a.text_3xl, a.font_bold, a.leading_snug, style]}>
      {children}
    </Text>
  )
}

export function OnboardingDescriptionText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  const t = useTheme()
  return (
    <P style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium, style]}>
      {children}
    </P>
  )
}
