import { useState } from 'react';
import { type DisplayRestrictions, ModerationCauseType } from '@atcute/bluesky-moderation';
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

import { m } from '#/paraglide/messages';

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
					<desc.icon fill="currentColor" size="xl" />
				</div>
			</div>
			<Text className={css.title} size="_4xl" weight="semiBold">
				{isNoPwi ? m['common.session.signInRequiredTitle']() : m['common.moderation.contentWarning']()}
			</Text>
			{isNoPwi ? (
				<Text className={css.body} color="textContrastMedium" size="lg">
					{m['components.moderation.signInRequired.message']()}
				</Text>
			) : (
				<Text className={css.body} color="textContrastMedium" size="lg">
					{m['components.moderation.label.flaggedPrefix']({ type: screenDescription })}{' '}
					<Text color="text" size="lg" weight="semiBold">
						{desc.name}.{' '}
					</Text>
					<Dialog.Trigger
						aria-label={m['components.moderation.label.learnMore.aboutWarning']()}
						className={css.learnMore}
						handle={control}
					>
						<Text color="primary_500" size="lg">
							{m['components.moderation.label.learnMore.label']()}
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
					label={m['common.action.goBack']()}
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
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
				{!modui.noOverride && (
					<Button
						className={css.pill}
						color="secondary"
						label={m['common.moderation.showAnyway']()}
						onClick={() => setOverride((v) => !v)}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.moderation.showAnyway']()}</ButtonText>
					</Button>
				)}
			</div>
		</div>
	);
}
