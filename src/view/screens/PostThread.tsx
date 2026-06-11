import { useLingui } from '@lingui/react/macro';

import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostThread } from '#/screens/PostThread';

import * as Layout from '#/components/web/Layout';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>;
export function PostThreadScreen({ route }: Props) {
	const { name, rkey } = route.params;
	const { t: l } = useLingui();
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useSetTitle(post ? l`Post by @${post.author.handle}` : undefined);

	return (
		<Layout.Screen>
			<PostThread uri={uri} />
		</Layout.Screen>
	);
}
