import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';

import {
	type UsePreferencesQueryResponse,
	usePreferencesQuery,
	useSetVerificationPrefsMutation,
} from '#/state/queries/preferences';

import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import * as SettingsList from '#/components/SettingsList';
import { Spinner } from '#/components/Spinner';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';

import * as styles from './VerificationSettings.css';

export function Screen() {
	const { t: l } = useLingui();
	const { data: preferences } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Verification Settings</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Item>
						<Admonition type="tip">
							<Trans>
								Verifications on Bluesky work differently than on other platforms.{' '}
								<InlineLinkText
									label={l({
										context: `english-only-resource`,
										message: `Learn more`,
									})}
									to={urls.website.blog.initialVerificationAnnouncement}
								>
									Learn more here.
								</InlineLinkText>
							</Trans>
						</Admonition>
					</SettingsList.Item>
					{preferences ? (
						<Inner preferences={preferences} />
					) : (
						<div className={styles.loaderWrap}>
							<Spinner color="currentColor" label={l`Loading`} size="xl" />
						</div>
					)}
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

function Inner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { t: l } = useLingui();
	const { hideBadges } = preferences.verificationPrefs;
	const { isPending, mutate: setVerificationPrefs } = useSetVerificationPrefsMutation();

	return (
		<SettingsList.CheckboxItem
			disabled={isPending}
			label={l`Hide verification badges`}
			onChange={(value) => {
				setVerificationPrefs({ hideBadges: value });
			}}
			value={hideBadges}
		>
			<SettingsList.ItemIcon icon={CircleCheck} />
			<SettingsList.ItemText>
				<Trans>Hide verification badges</Trans>
			</SettingsList.ItemText>
			<SettingsList.CheckboxBox />
		</SettingsList.CheckboxItem>
	);
}
