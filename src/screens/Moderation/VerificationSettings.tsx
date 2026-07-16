import { urls } from '#/lib/constants';
import { useTitle } from '#/lib/hooks/useTitle';

import {
	type UsePreferencesQueryResponse,
	usePreferencesQuery,
	useSetVerificationPrefsMutation,
} from '#/state/queries/preferences';

import { Trans } from '#/locale/Trans';

import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import * as Settings from '#/components/SettingsCards';
import { Spinner } from '#/components/Spinner';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './VerificationSettings.css';

export function Screen() {
	useTitle(m['common.verification.settingsTitle']());

	const { data: preferences } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.verification.settingsTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Admonition type="tip">
						<Trans
							message={m['screens.moderation.verification.info']}
							markup={{
								t0: ({ children }) => (
									<ExternalInlineLinkText
										label={m['common.action.learnMore']()}
										href={urls.website.blog.initialVerificationAnnouncement}
									>
										{children}
									</ExternalInlineLinkText>
								),
							}}
						/>
					</Admonition>
					{preferences ? (
						<Inner preferences={preferences} />
					) : (
						<div className={styles.loaderWrap}>
							<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
						</div>
					)}
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}

function Inner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { hideBadges } = preferences.verificationPrefs;
	const { isPending, mutate: setVerificationPrefs } = useSetVerificationPrefsMutation();

	return (
		<Settings.Section>
			<Settings.SwitchRow
				disabled={isPending}
				label={m['screens.moderation.verification.hideBadges']()}
				onChange={(value) => setVerificationPrefs({ hideBadges: value })}
				value={hideBadges}
			>
				<Settings.Icon icon={CircleCheck} />
				<Settings.Label titleText={m['screens.moderation.verification.hideBadges']()} />
			</Settings.SwitchRow>
		</Settings.Section>
	);
}
