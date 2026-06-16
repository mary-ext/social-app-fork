import { useState } from 'react';
import { type DisplayRestrictions, ModerationCauseType } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import type { NavigationProp } from '#/lib/routes/types';

import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import {
	ModerationDetailsDialog,
	useModerationDetailsDialogControl,
} from '#/components/web/moderation/ModerationDetailsDialog';

import * as css from './ScreenHider.css';

export function ScreenHider({
	screenDescription,
	modui,
	className,
	children,
}: React.PropsWithChildren<{
	screenDescription: string;
	modui: DisplayRestrictions;
	className?: string;
}>) {
	const { t: l } = useLingui();
	const [override, setOverride] = useState(false);
	const navigation = useNavigation<NavigationProp>();
	const control = useModerationDetailsDialogControl();
	const blur = modui.blurs[0];
	const desc = useModerationCauseDescription(blur);

	if (!blur || override) {
		return <div className={className}>{children}</div>;
	}

	const isNoPwi = !!modui.blurs.find(
		(cause) =>
			cause.type === ModerationCauseType.Label && cause.labelDef.identifier === '!no-unauthenticated',
	);
	return (
		<div className={css.container}>
			<div className={css.badgeWrap}>
				<div className={css.badge}>
					<desc.icon fill="currentColor" width={24} />
				</div>
			</div>
			<Text className={css.title} size="_4xl" weight="semiBold">
				{isNoPwi ? <Trans>Sign-in Required</Trans> : <Trans>Content Warning</Trans>}
			</Text>
			{isNoPwi ? (
				<Text className={css.body} color="textContrastMedium" size="lg">
					<Trans>This account has requested that users sign in to view their profile.</Trans>
				</Text>
			) : (
				<Text className={css.body} color="textContrastMedium" size="lg">
					<Trans>This {screenDescription} has been flagged:</Trans>{' '}
					<Text color="text" size="lg" weight="semiBold">
						{desc.name}.{' '}
					</Text>
					<Dialog.Trigger
						aria-label={l`Learn more about this warning`}
						className={css.learnMore}
						handle={control}
					>
						<Text color="primary_500" size="lg">
							<Trans>Learn More</Trans>
						</Text>
					</Dialog.Trigger>
				</Text>
			)}
			{!isNoPwi && <ModerationDetailsDialog control={control} modcause={blur} />}
			<div className={css.spacer} />
			<div className={css.buttonRow}>
				<Button
					className={css.pill}
					color="primary"
					label={l`Go back`}
					onClick={() => {
						if (navigation.canGoBack()) {
							navigation.goBack();
						} else {
							navigation.navigate('Home');
						}
					}}
					size="large"
					variant="solid"
				>
					<ButtonText>
						<Trans>Go back</Trans>
					</ButtonText>
				</Button>
				{!modui.noOverride && (
					<Button
						className={css.pill}
						color="secondary"
						label={l`Show anyway`}
						onClick={() => setOverride((v) => !v)}
						size="large"
						variant="solid"
					>
						<ButtonText>
							<Trans>Show anyway</Trans>
						</ButtonText>
					</Button>
				)}
			</div>
		</div>
	);
}
