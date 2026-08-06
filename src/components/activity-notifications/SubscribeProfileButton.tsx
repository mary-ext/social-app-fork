import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { profileDisplayName } from '#/lib/strings/display-names';

import { SubscribeProfileDialog } from '#/components/activity-notifications/SubscribeProfileDialog';
import * as Dialog from '#/components/Dialog';
import { Button, ButtonIcon } from '#/components/web/Button';

import BellPlusIcon from '#/icons/central-custom/BellPlus_round_outlined_radius1_stroke2.svg';
import BellRingingIcon from '#/icons/central-custom/BellRinging_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/** Round bell button opening the activity-subscription dialog. */
export function SubscribeProfileButton({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const handle = Dialog.useDialogHandle();

	const name = profileDisplayName(profile, { bareHandle: true });
	const isSubscribed =
		profile.viewer?.activitySubscription?.post || profile.viewer?.activitySubscription?.reply;
	const Icon = isSubscribed ? BellRingingIcon : BellPlusIcon;

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button
						color="secondary"
						label={m['components.activityNotifications.whenPostsHint']({ name })}
						shape="round"
						size="small"
					>
						<ButtonIcon icon={Icon} size="md" />
					</Button>
				}
			/>
			<SubscribeProfileDialog handle={handle} moderationOpts={moderationOpts} profile={profile} />
		</>
	);
}
