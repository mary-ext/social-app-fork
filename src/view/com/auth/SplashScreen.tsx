import { View } from 'react-native';

import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';

import { atoms as a, useTheme } from '#/alf';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export const SplashScreen = ({ onPressSignin }: { onPressSignin: () => void }) => {
	const t = useTheme();
	const { isTabletOrMobile: IS_WEB_MOBILE } = useWebMediaQueries();

	return (
		<View style={[a.h_full, a.flex_1]}>
			<View
				testID="noSessionView"
				style={[
					a.h_full,
					a.justify_center,
					// @ts-expect-error web only
					{ paddingBottom: '20vh' },
					IS_WEB_MOBILE && a.pb_5xl,
					t.atoms.border_contrast_medium,
					a.align_center,
					a.gap_5xl,
					a.flex_1,
				]}
			>
				<ErrorBoundary>
					<View style={[a.justify_center, a.align_center]}>
						<Logo width={92} fill="sky" />

						<View style={[a.pb_sm, a.pt_5xl]}>
							<Logotype width={161} fill={colors.text} />
						</View>

						<Text style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium]}>
							{m['common.compose.placeholder']()}
						</Text>
					</View>

					<View
						testID="signinOrCreateAccount"
						style={[a.w_full, a.px_xl, a.gap_md, a.pb_2xl, { maxWidth: 320 }]}
					>
						<Button
							testID="signInButton"
							onPress={onPressSignin}
							label={m['common.session.action.signIn']()}
							accessibilityHint={m['view.auth.signIn.a11yHint']()}
							size="large"
							variant="solid"
							color="secondary"
						>
							<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
						</Button>
					</View>
				</ErrorBoundary>
			</View>
			<Footer />
		</View>
	);
};

function Footer() {
	const t = useTheme();
	return (
		<View
			style={[
				a.absolute,
				a.inset_0,
				{ top: 'auto' },
				a.px_xl,
				a.py_lg,
				a.border_t,
				a.flex_row,
				a.align_center,
				a.flex_wrap,
				a.gap_xl,
				a.flex_1,
				t.atoms.border_contrast_medium,
			]}
		>
			<InlineLinkText label={m['view.auth.links.learnMore']()} to="https://bsky.social">
				{m['view.auth.links.business']()}
			</InlineLinkText>
			<InlineLinkText label={m['view.auth.links.blogA11y']()} to="https://bsky.social/about/blog">
				{m['view.auth.links.blog']()}
			</InlineLinkText>
			<InlineLinkText label={m['view.auth.links.jobsA11y']()} to="https://bsky.social/about/join">
				{m['view.auth.links.jobs']()}
			</InlineLinkText>
			<View style={a.flex_1} />
			<AppLanguageDropdown />
		</View>
	);
}
