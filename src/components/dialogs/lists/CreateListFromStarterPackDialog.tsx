import {View} from 'react-native'
import {
  type AppBskyGraphDefs,
  type AppBskyGraphStarterpack,
  AtUri,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {CreateOrEditListDialog} from './CreateOrEditListDialog'

export function CreateListFromStarterPackDialog({
  control,
  starterPack,
}: {
  control: Dialog.DialogControlProps
  starterPack: AppBskyGraphDefs.StarterPackView
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const queryClient = useQueryClient()
  const createDialogControl = Dialog.useDialogControl()
  const loadingDialogControl = Dialog.useDialogControl()

  const record = starterPack.record as AppBskyGraphStarterpack.Record

  const onPressCreate = () => {
    control.close(() => createDialogControl.open())
  }

  const addMembersAndNavigate = async (listUri: string) => {
    const navigateToList = () => {
      const urip = new AtUri(listUri)
      navigation.navigate('ProfileList', {
        name: urip.hostname,
        rkey: urip.rkey,
      })
    }

    if (!starterPack.list || !currentAccount) {
      loadingDialogControl.close(navigateToList)
      return
    }

    try {
      // Fetch all members and add them, with minimum 3s duration for UX

      queryClient.invalidateQueries({queryKey: ['list-members', listUri]})
    } catch (e) {
      logger.error('Failed to add members to list', {safeMessage: e})
      Toast.show(l`List created, but failed to add some members`, {
        type: 'error',
      })
    }

    loadingDialogControl.close(navigateToList)
  }

  const onListCreated = (listUri: string) => {
    loadingDialogControl.open()
    addMembersAndNavigate(listUri)
  }

  return (
    <>
      <Dialog.Outer
        control={control}
        testID="createListFromStarterPackDialog"
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Create list from starter pack`}
          style={{maxWidth: 400} as any}>
          <View style={[a.gap_lg]}>
            <Text style={[a.text_xl, a.font_bold]}>
              <Trans>Create list from starter pack</Trans>
            </Text>

            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              <Trans>
                This will create a new list with the same name, description, and
                members as this starter pack.
              </Trans>
            </Text>

            <Admonition type="tip">
              <Trans>
                Changes to the starter pack will not be reflected in the list
                after creation. The list will be an independent copy.
              </Trans>
            </Admonition>

            <View style={[a.flex_row_reverse, a.gap_md, a.pt_sm]}>
              <Button
                label={l`Create list`}
                onPress={onPressCreate}
                size={'small'}
                color="primary">
                <ButtonText>
                  <Trans>Create list</Trans>
                </ButtonText>
              </Button>
              <Button
                label={l`Cancel`}
                onPress={() => control.close()}
                size={'small'}
                color="secondary">
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
      <CreateOrEditListDialog
        control={createDialogControl}
        purpose="app.bsky.graph.defs#curatelist"
        onSave={onListCreated}
        initialValues={{
          name: record.name,
          description: record.description,
          avatar: starterPack.list?.avatar,
        }}
      />
      <Dialog.Outer
        control={loadingDialogControl}
        nativeOptions={{preventDismiss: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Adding members to list...`}
          style={{maxWidth: 400} as any}>
          <View style={[a.align_center, a.gap_lg, a.py_5xl]}>
            <Loader size="xl" />
            <Text style={[a.text_lg, t.atoms.text_contrast_high]}>
              <Trans>Adding members to list...</Trans>
            </Text>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
