import type { AnyProfileView } from '@atcute/bluesky';

import { BotAccountAlert } from '#/components/BotAccountAlert';
import * as css from '#/components/BotBadge.css';
import * as Dialog from '#/components/Dialog';

import RobotIcon from '#/icons/central/Robot_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function isBotAccount(profile: { did: string; labels?: { src: string; val: string }[] }): boolean {
	return profile.labels?.some((l) => l.val === 'bot' && l.src === profile.did) ?? false;
}

export function BotBadge({ profile, width }: { profile: AnyProfileView; width: number }) {
	if (!isBotAccount(profile)) {
		return null;
	}

	return <RobotIcon className={css.icon} width={width} height={width} />;
}

export function BotBadgeButton({ profile, width }: { profile: AnyProfileView; width: number }) {
	const handle = Dialog.useDialogHandle();

	if (!isBotAccount(profile)) {
		return null;
	}

	return (
		<>
			<Dialog.Trigger aria-label={m['common.account.automated']()} className={css.button} handle={handle}>
				<RobotIcon width={width} height={width} />
			</Dialog.Trigger>
			<BotAccountAlert handle={handle} profile={profile} />
		</>
	);
}
