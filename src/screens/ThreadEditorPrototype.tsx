import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ThreadEditor } from '#/features/thread-editor/ThreadEditor';

import * as Layout from '#/components/web/Layout';

/**
 * thread editor screen.
 *
 * @returns the editor with the signed-in user's avatar
 */
export function ThreadEditorPrototypeScreen() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>Thread editor</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<ThreadEditor avatar={profile?.avatar} />
			</Layout.Content>
		</Layout.Screen>
	);
}
