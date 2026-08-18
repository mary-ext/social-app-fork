import { makeRecordUri } from '#/lib/at-uri';

import { useTitle } from '#/state/use-title';

import { LikedByList } from '#/components/LikedByList';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export const CustomFeedLikedByScreen = () => {
	useTitle(m['navigation.likedBy.title']());

	const [{ actor, rkey }] = useParams('CustomFeedLikedBy');
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
