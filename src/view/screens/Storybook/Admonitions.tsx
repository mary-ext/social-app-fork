import { Text as RNText, View } from 'react-native';

import { Trans } from '#/locale/Trans';

import { atoms as a, useTheme } from '#/alf';

import {
	Admonition,
	Button as AdmonitionButton,
	Content as AdmonitionContent,
	Icon as AdmonitionIcon,
	Outer as AdmonitionOuter,
	Row as AdmonitionRow,
	Text as AdmonitionText,
} from '#/components/Admonition';
import { ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry } from '#/components/icons/ArrowRotate';
import { BellRinging_Filled_Corner0_Rounded as BellRingingFilledIcon } from '#/components/icons/BellRinging';
import { InlineLinkText } from '#/components/Link';
import { H1 } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function Admonitions() {
	const t = useTheme();

	return (
		<View style={[a.gap_md]}>
			<H1>Admonitions</H1>
			<Admonition>The quick brown fox jumps over the lazy dog.</Admonition>
			<Admonition type="info">
				How happy the blameless vestal's lot, the world forgetting by the world forgot.{' '}
				<InlineLinkText label="test" to="https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/">
					Eternal sunshine of the spotless mind
				</InlineLinkText>
				! Each pray'r accepted, and each wish resign'd.
			</Admonition>
			<Admonition type="tip">The quick brown fox jumps over the lazy dog.</Admonition>
			<Admonition type="warning">The quick brown fox jumps over the lazy dog.</Admonition>
			<Admonition type="error">The quick brown fox jumps over the lazy dog.</Admonition>
			<AdmonitionOuter type="error">
				<AdmonitionRow>
					<AdmonitionIcon />
					<AdmonitionContent>
						<AdmonitionText>{m['common.error.generic']()}</AdmonitionText>
					</AdmonitionContent>
					<AdmonitionButton
						color="negative_subtle"
						label={m['components.moderation.report.retry']()}
						onPress={() => {}}
					>
						<ButtonText>{m['common.action.retry']()}</ButtonText>
						<ButtonIcon icon={Retry} />
					</AdmonitionButton>
				</AdmonitionRow>
			</AdmonitionOuter>
			<AdmonitionOuter type="tip">
				<AdmonitionRow>
					<AdmonitionIcon />
					<AdmonitionContent>
						<AdmonitionText>
							<Trans
								message={m['view.notifications.settings.enableHint']}
								markup={{
									t0: ({ children }) => (
										<RNText style={[a.font_bold, t.atoms.text_contrast_high]}>{children}</RNText>
									),
									t1: () => <BellRingingFilledIcon size="xs" style={t.atoms.text_contrast_high} />,
								}}
							/>
						</AdmonitionText>
						<AdmonitionText>
							<Trans
								message={m['view.notifications.settings.restrictHint']}
								markup={{
									t0: ({ children }) => (
										<InlineLinkText
											label={m['screens.settings.account.privacyLink']()}
											to={{ screen: 'AccountSettings' }}
											style={[a.font_bold]}
										>
											{children}
										</InlineLinkText>
									),
								}}
							/>
						</AdmonitionText>
					</AdmonitionContent>
				</AdmonitionRow>
			</AdmonitionOuter>
		</View>
	);
}
