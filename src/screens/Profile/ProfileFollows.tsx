import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';

import { ProfileFollows as ProfileFollowsComponent } from '#/view/com/profile/ProfileFollows';

import * as Layout from '#/components/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>;
export const ProfileFollowsScreen = ({ route }: Props) => {
	const { name } = route.params;
	const { data: resolvedDid } = useResolveDidQuery(name);
	const { data: profile } = useProfileQuery({
		did: resolvedDid,
	});

	useSetTitle(profile ? m['screens.profile.title.following']({ handle: profile.handle }) : undefined);

	return (
		<Layout.Screen testID="profileFollowsScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{profile && (
						<>
							<Layout.Header.TitleText>
								{sanitizeDisplayName(profile.displayName || profile.handle)}
							</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.profile.count.following']({ count: profile.followsCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<ProfileFollowsComponent name={name} />
		</Layout.Screen>
	);
};
