import {Platform} from 'react-native'
import {Trans,useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useMutation} from '@tanstack/react-query'

import {STATUS_PAGE_URL} from '#/lib/constants'
import {getDeviceId} from '#/lib/device-id'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {BroomSparkle_Stroke2_Corner2_Rounded as BroomSparkleIcon} from '#/components/icons/BroomSparkle'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon} from '#/components/icons/CodeLines'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Newspaper_Stroke2_Corner2_Rounded as NewspaperIcon} from '#/components/icons/Newspaper'
import {Wrench_Stroke2_Corner2_Rounded as WrenchIcon} from '#/components/icons/Wrench'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {SendErrorReportDialog} from '#/components/SendErrorReportDialog'
import * as Toast from '#/components/Toast'
import * as env from '#/env'
import {setStringAsync} from '#/shims/clipboard'
import * as FileSystem from '#/shims/file-system/legacy'
import {Image} from '#/shims/image'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {OTAInfo} from './components/OTAInfo'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AboutSettings'>
export function AboutSettingsScreen({}: Props) {
  const {t: l, i18n} = useLingui()
  const [devModeEnabled, setDevModeEnabled] = useDevMode()
  const [demoModeEnabled, setDemoModeEnabled] = useDemoMode()
  const sendErrorReportControl = Prompt.usePromptControl()

  const {mutate: onClearImageCache, isPending: isClearingImageCache} =
    useMutation({
      mutationFn: async () => {
        const freeSpaceBefore = await FileSystem.getFreeDiskStorageAsync()
        await Image.clearDiskCache()
        const freeSpaceAfter = await FileSystem.getFreeDiskStorageAsync()
        const spaceDiff = freeSpaceBefore - freeSpaceAfter
        return spaceDiff * -1
      },
      onSuccess: sizeDiffBytes => {
        Toast.show(l`Image cache cleared`)
      },
    })

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>About</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="https://bsky.social/about/support/tos"
            label={l`Terms of Service`}>
            <SettingsList.ItemIcon icon={NewspaperIcon} />
            <SettingsList.ItemText>
              <Trans>Terms of Service</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="https://bsky.social/about/support/privacy-policy"
            label={l`Privacy Policy`}>
            <SettingsList.ItemIcon icon={NewspaperIcon} />
            <SettingsList.ItemText>
              <Trans>Privacy Policy</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem to={STATUS_PAGE_URL} label={l`Status Page`}>
            <SettingsList.ItemIcon icon={GlobeIcon} />
            <SettingsList.ItemText>
              <Trans>Status Page</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          <SettingsList.LinkItem to="/sys/log" label={l`System log`}>
            <SettingsList.ItemIcon icon={CodeLinesIcon} />
            <SettingsList.ItemText>
              <Trans>System log</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.PressableItem
            onPress={() => sendErrorReportControl.open()}
            label={l`Send error report`}>
            <SettingsList.ItemIcon icon={BubblesIcon} />
            <SettingsList.ItemText>
              <Trans>Send error report</Trans>
            </SettingsList.ItemText>
          </SettingsList.PressableItem>

          <SettingsList.PressableItem
            label={l`Version ${env.APP_VERSION}`}
            accessibilityHint={l`Copies build version to clipboard`}
            onLongPress={() => {
              const newDevModeEnabled = !devModeEnabled
              setDevModeEnabled(newDevModeEnabled)
              Toast.show(
                newDevModeEnabled
                  ? l({
                      message: 'Developer mode enabled',
                      context: 'toast',
                    })
                  : l({
                      message: 'Developer mode disabled',
                      context: 'toast',
                    }),
              )
            }}
            onPress={() => {
              setStringAsync(
                `Build version: ${env.APP_VERSION}; Bundle info: ${env.APP_METADATA}; Bundle date: ${env.BUNDLE_DATE}; Platform: ${'web'}; Platform version: ${Platform.Version}; Device ID: ${getDeviceId()}`,
              )
              Toast.show(l`Copied build version to clipboard`)
            }}>
            <SettingsList.ItemIcon icon={WrenchIcon} />
            <SettingsList.ItemText>
              <Trans>Version {env.APP_VERSION}</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeText>{env.APP_METADATA}</SettingsList.BadgeText>
          </SettingsList.PressableItem>
          {devModeEnabled && (
            <>
              <OTAInfo />
              {false}
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
      <SendErrorReportDialog control={sendErrorReportControl} />
    </Layout.Screen>
  );
}
