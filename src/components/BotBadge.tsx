import type { AnyProfileView } from '@atcute/bluesky';

import { BotAccountAlert } from '#/components/BotAccountAlert';
import * as css from '#/components/BotBadge.css';
import * as Dialog from '#/components/Dialog';
import { Bot_Filled as RobotIcon } from '#/components/icons/Bot';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function isBotAccount(profile: { did: string; labels?: { src: string; val: string }[] }): boolean {
	return profile.labels?.some((l) => l.val === 'bot' && l.src === profile.did) ?? false;
}

export function BotBadge({
	alwaysShow = false,
	profile,
	width,
}: {
	alwaysShow?: boolean;
	profile: AnyProfileView;
	width: number;
}) {
	if (!isBotAccount(profile) && !alwaysShow) {
		return null;
	}

	return <RobotIcon width={width} fill={colors.textContrastMedium} className={css.icon} />;
}

export function BotBadgeButton({ profile, width }: { profile: AnyProfileView; width: number }) {
	const handle = Dialog.useDialogHandle();

	if (!isBotAccount(profile)) {
		return null;
	}

	return (
		<>
			<Dialog.Trigger
				aria-label={m['common.account.automated']()}
				className={css.button}
				handle={handle}
				onClick={(e) => e.stopPropagation()}
			>
				<RobotIcon width={width} fill="currentColor" />
			</Dialog.Trigger>
			<BotAccountAlert handle={handle} profile={profile} />
		</>
	);
}
