import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import {
  type ListRenderItemInfo,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyGraphDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {RQKEY, useProfileListsQuery} from '#/state/queries/profile-lists'
import {useSession} from '#/state/session'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListRef} from '#/view/com/util/List'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke1_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import * as ListCard from '#/components/ListCard'
import {ListFooter} from '#/components/Lists'

const LOADING = {_reactKey: '__loading__'} as const
const EMPTY = {_reactKey: '__empty__'} as const
const ERROR_ITEM = {_reactKey: '__error__'} as const
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'} as const

type ProfileListItem =
  | AppBskyGraphDefs.ListView
  | typeof EMPTY
  | typeof ERROR_ITEM
  | typeof LOADING
  | typeof LOAD_MORE_ERROR_ITEM
type ProfileListSentinel = Exclude<ProfileListItem, AppBskyGraphDefs.ListView>

const isProfileListSentinel = (
  item: ProfileListItem,
): item is ProfileListSentinel => {
  return '_reactKey' in item
}

interface SectionRef {
  scrollToTop: () => void
}

interface ProfileListsProps {
  ref?: React.Ref<SectionRef>
  did: string
  scrollElRef: ListRef
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  setScrollViewTag: (tag: number | null) => void
}

export function ProfileLists({
  ref,
  did,
  scrollElRef,
  headerOffset,
  enabled,
  style,
  testID,
  setScrollViewTag,
}: ProfileListsProps) {
  const {t: l} = useLingui()
  const t = useTheme()
  const [isPTRing, setIsPTRing] = useState(false)
  const {height} = useWindowDimensions()
  const opts = useMemo(() => ({enabled}), [enabled])
  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useProfileListsQuery(did, opts)
  const isEmpty = !isPending && !data?.pages[0]?.lists.length
  const {data: preferences} = usePreferencesQuery()
  const navigation = useNavigation()
  const {currentAccount} = useSession()
  const isSelf = currentAccount?.did === did

  const items = useMemo(() => {
    let items: ProfileListItem[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (isPending) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      items = items.concat([EMPTY])
    } else if (data?.pages) {
      for (const page of data?.pages) {
        items = items.concat(page.lists)
      }
    } else if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isPending, data])

  // events
  // =

  const queryClient = useQueryClient()

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: false,
      offset: -headerOffset,
    })
    queryClient.invalidateQueries({queryKey: RQKEY(did)})
  }, [scrollElRef, queryClient, headerOffset, did])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more lists', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<ProfileListItem>) => {
      if (isProfileListSentinel(item)) {
        if (item === ERROR_ITEM) {
          return (
            <ErrorMessage
              message={cleanError(error)}
              onPressTryAgain={refetch}
            />
          )
        }
        if (item === LOAD_MORE_ERROR_ITEM) {
          return (
            <LoadMoreRetryBtn
              label={l`There was an issue fetching your lists. Tap here to try again.`}
              onPress={onPressRetryLoadMore}
            />
          )
        }
        if (item === LOADING) {
          return <FeedLoadingPlaceholder />
        }
        return (
          <EmptyState
            icon={ListIcon}
            message={
              isSelf ? l`You haven't created any lists yet.` : l`No lists`
            }
            textStyle={[t.atoms.text_contrast_medium, a.font_medium]}
            button={
              isSelf
                ? {
                    label: l`Create a list`,
                    text: l`Create a list`,
                    onPress: () => navigation.navigate('Lists' as never),
                    size: 'small',
                    color: 'primary',
                  }
                : undefined
            }
          />
        )
      }
      if (preferences) {
        return (
          <View
            style={[a.border_t, t.atoms.border_contrast_low, a.px_lg, a.py_lg]}>
            <ListCard.Default view={item} />
          </View>
        )
      }
      return null
    },
    [
      l,
      t,
      error,
      refetch,
      onPressRetryLoadMore,
      preferences,
      navigation,
      isSelf,
    ],
  )

  useEffect(() => {}, [enabled, scrollElRef, setScrollViewTag])

  const ProfileListsFooter = useCallback(() => {
    if (isEmpty) return null
    return (
      <ListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onRetry={fetchNextPage}
        error={cleanError(error)}
        height={180 + headerOffset}
      />
    )
  }, [
    hasNextPage,
    error,
    isFetchingNextPage,
    headerOffset,
    fetchNextPage,
    isEmpty,
  ])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={ProfileListsFooter}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        progressViewOffset={undefined}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
        contentContainerStyle={{minHeight: height + headerOffset}}
      />
    </View>
  )
}

function keyExtractor(item: ProfileListItem) {
  return isProfileListSentinel(item) ? item._reactKey : item.uri
}
