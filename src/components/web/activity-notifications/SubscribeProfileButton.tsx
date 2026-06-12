import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { SubscribeProfileDialog } from '#/components/activity-notifications/SubscribeProfileDialog';
import { useDialogControl } from '#/components/Dialog';
import { BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon } from '#/components/icons/BellPlus';
import { BellRinging_Filled_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Button, ButtonIcon } from '#/components/web/Button';

/** Round bell button opening the activity-subscription dialog. */
export function SubscribeProfileButton({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	const subscribeDialogControl = useDialogControl();

	const name = createSanitizedDisplayName(profile, true);
	const isSubscribed =
		profile.viewer?.activitySubscription?.post || profile.viewer?.activitySubscription?.reply;
	const Icon = isSubscribed ? BellRingingIcon : BellPlusIcon;

	return (
		<>
			<Button
				color="secondary"
				label={l`Get notified when ${name} posts`}
				onClick={() => subscribeDialogControl.open()}
				shape="round"
				size="small"
			>
				<ButtonIcon icon={Icon} size="md" />
			</Button>
			<SubscribeProfileDialog
				control={subscribeDialogControl}
				moderationOpts={moderationOpts}
				profile={profile}
			/>
		</>
	);
}
