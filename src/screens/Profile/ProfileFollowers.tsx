import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';

import { ProfileFollowers as ProfileFollowersComponent } from '#/view/com/profile/ProfileFollowers';

import * as Layout from '#/components/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>;
export const ProfileFollowersScreen = ({ route }: Props) => {
	const { name } = route.params;
	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({
		did: resolvedDid,
	});

	const followersCount = profile?.followersCount;

	useSetTitle(profile ? m['screens.profile.follow.followers.title']({ handle: profile.handle }) : undefined);

	return (
		<Layout.Screen testID="profileFollowersScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{profile && (
						<>
							<Layout.Header.TitleText>
								{sanitizeDisplayName(profile.displayName || profile.handle)}
							</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.profile.follow.followers.count']({ count: followersCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<ProfileFollowersComponent name={name} initialCount={followersCount} />
		</Layout.Screen>
	);
};
