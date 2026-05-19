import {memo} from 'react'
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {Link} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'

let AutocompleteResults = ({
  isAutocompleteFetching,
  autocompleteData,
  searchText,
  onResultPress,
  onProfileClick,
}: {
  isAutocompleteFetching: boolean
  autocompleteData: AppBskyActorDefs.ProfileViewBasic[] | undefined
  searchText: string
  onSubmit: () => void
  onResultPress: () => void
  onProfileClick: (profile: AppBskyActorDefs.ProfileViewBasic) => void
}): React.ReactNode => {
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  return (
    <>
      {(isAutocompleteFetching && !autocompleteData?.length) ||
      !moderationOpts ? (
        <Layout.Content>
          <View style={[a.py_xl]}>
            <ActivityIndicator />
          </View>
        </Layout.Content>
      ) : (
        <Layout.Content
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <SearchLinkCard
            label={l`Search for "${searchText}"`}
            onPress={undefined as any}
            to={`/search?q=${encodeURIComponent(searchText)}`}
            style={a.border_b}
          />
          {autocompleteData?.map((item, _index) => (
            <SearchProfileCard
              key={item.did}
              profile={item}
              moderationOpts={moderationOpts}
              onPress={() => {
                onProfileClick(item)
                onResultPress()
              }}
            />
          ))}
          <View style={{height: 200}} />
        </Layout.Content>
      )}
    </>
  )
}
AutocompleteResults = memo(AutocompleteResults)
export {AutocompleteResults}

let SearchLinkCard = ({
  label,
  to,
  onPress,
  style,
}: {
  label: string
  to?: string
  onPress?: () => void
  style?: ViewStyle
}): React.ReactNode => {
  const pal = usePalette('default')

  const inner = (
    <View
      style={[pal.border, {paddingVertical: 16, paddingHorizontal: 12}, style]}>
      <Text type="md" style={[pal.text]}>
        {label}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityHint="">
        {inner}
      </TouchableOpacity>
    )
  }

  return (
    <Link href={to} asAnchor anchorNoUnderline>
      <View
        style={[
          pal.border,
          {paddingVertical: 16, paddingHorizontal: 12},
          style,
        ]}>
        <Text type="md" style={[pal.text]}>
          {label}
        </Text>
      </View>
    </Link>
  )
}
