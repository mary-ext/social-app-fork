import { useTitle } from '#/lib/hooks/useTitle';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { LikedByList } from '#/components/LikedByList';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export function ProfileLabelerLikedByScreen() {
	const [{ actor: handleOrDid }] = useParams('ProfileLabelerLikedBy');
	const uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self');

	useTitle(m['navigation.likedBy.title']());

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
}
