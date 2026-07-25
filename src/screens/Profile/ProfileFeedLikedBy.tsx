import { useTitle } from '#/lib/hooks/useTitle';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { LikedByList } from '#/components/LikedByList';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export const ProfileFeedLikedByScreen = () => {
	useTitle(m['navigation.likedBy.title']());

	const [{ actor, rkey }] = useParams('ProfileFeedLikedBy');
	const uri = makeRecordUri(actor, 'app.bsky.feed.generator', rkey);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.like.likedByTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<LikedByList uri={uri} />
		</Layout.Screen>
	);
};
