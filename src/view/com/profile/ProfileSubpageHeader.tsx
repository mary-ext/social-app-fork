import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { sanitizeHandle } from '#/lib/strings/handles';

import { softReset } from '#/state/events';

import { Trans } from '#/locale/Trans';

import { TextLink } from '#/view/com/util/Link';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { Text } from '#/view/com/util/text/Text';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { StarterPack } from '#/components/icons/StarterPack';
import * as Layout from '#/components/Layout';
import { UserAvatar, type UserAvatarType } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

export function ProfileSubpageHeader({
	isLoading,
	href,
	title,
	avatar,
	isOwner,
	purpose,
	creator,
	avatarType,
	children,
}: React.PropsWithChildren<{
	isLoading?: boolean;
	href: string;
	title: string | undefined;
	avatar: string | undefined;
	isOwner: boolean | undefined;
	purpose: AppBskyGraphDefs.ListPurpose | undefined;
	creator:
		| {
				did: string;
				handle: string;
		  }
		| undefined;
	avatarType: UserAvatarType | 'starter-pack';
}>) {
	const navigation = useNavigation<NavigationProp>();
	const { isMobile } = useWebMediaQueries();
	const { lightboxControl } = useGlobalDialogsControlContext();
	const pal = usePalette('default');
	const canGoBack = navigation.canGoBack();

	const onPressAvi = useCallback(() => {
		if (
			avatar // TODO && !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
		) {
			lightboxControl.openWithPayload({
				images: [{ src: avatar }],
				index: 0,
			});
		}
	}, [lightboxControl, avatar]);

	return (
		<>
			<Layout.Header.Outer>
				{canGoBack ? <Layout.Header.BackButton /> : <Layout.Header.MenuButton />}
				<Layout.Header.Content />
				{children}
			</Layout.Header.Outer>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'flex-start',
					gap: 10,
					paddingTop: 14,
					paddingBottom: 14,
					paddingHorizontal: isMobile ? 12 : 14,
				}}
			>
				<View>
					<Pressable
						testID="headerAviButton"
						onPress={onPressAvi}
						accessibilityRole="image"
						accessibilityLabel={m['view.profile.action.viewAvatar']()}
						accessibilityHint=""
						style={{ width: 58 }}
					>
						{avatarType === 'starter-pack' ? (
							<StarterPack width={58} gradient="sky" />
						) : (
							<UserAvatar type={avatarType} size={58} avatar={avatar} />
						)}
					</Pressable>
				</View>
				<View style={{ flex: 1, gap: 4 }}>
					{isLoading ? (
						<LoadingPlaceholder width={200} height={32} style={{ marginVertical: 6 }} />
					) : (
						<TextLink
							testID="headerTitle"
							type="title-xl"
							href={href}
							style={[pal.text, { fontWeight: '600' }]}
							text={title || ''}
							onPress={() => softReset.emit()}
							numberOfLines={4}
						/>
					)}

					{isLoading || !creator ? (
						<LoadingPlaceholder width={50} height={8} />
					) : (
						<Text type="lg" style={[pal.textLight]} numberOfLines={1}>
							{purpose === 'app.bsky.graph.defs#curatelist' ? (
								isOwner ? (
									m['view.profile.label.listByYou']()
								) : (
									<Trans
										message={m['view.profile.label.listBy']}
										markup={{
											t0: () => (
												<TextLink
													text={sanitizeHandle(creator.handle || '', '@')}
													href={makeProfileLink(creator)}
													style={pal.textLight}
												/>
											),
										}}
									/>
								)
							) : purpose === 'app.bsky.graph.defs#modlist' ? (
								isOwner ? (
									m['view.profile.label.modListByYou']()
								) : (
									<Trans
										message={m['view.profile.label.modListBy']}
										markup={{
											t0: () => (
												<TextLink
													text={sanitizeHandle(creator.handle || '', '@')}
													href={makeProfileLink(creator)}
													style={pal.textLight}
												/>
											),
										}}
									/>
								)
							) : purpose === 'app.bsky.graph.defs#referencelist' ? (
								isOwner ? (
									m['common.label.starterPackByYou']()
								) : (
									<Trans
										message={m['view.profile.label.starterPackBy']}
										markup={{
											t0: () => (
												<TextLink
													text={sanitizeHandle(creator.handle || '', '@')}
													href={makeProfileLink(creator)}
													style={pal.textLight}
												/>
											),
										}}
									/>
								)
							) : null}
						</Text>
					)}
				</View>
			</View>
		</>
	);
}
