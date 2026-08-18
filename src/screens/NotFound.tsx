import { EmptyState } from '#/components/EmptyState';
import * as Layout from '#/components/web/Layout';

import PageCrossTextIcon from '#/icons/central/PageCrossText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export const NotFoundScreen = () => {
	const router = useRouter();

	const canGoBack = router.canGoBack;
	const onPressHome = () => {
		if (canGoBack) {
			router.back();
		} else {
			router.popTo({ name: 'Home' });
		}
	};

	const label = canGoBack ? m['common.action.goBack']() : m['common.action.goHome']();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.error.pageNotFound']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<EmptyState
				icon={PageCrossTextIcon}
				message={m['common.error.notFoundDescription']()}
				button={{
					color: 'primary',
					label,
					onPress: onPressHome,
					text: label,
				}}
			/>
		</Layout.Screen>
	);
};
