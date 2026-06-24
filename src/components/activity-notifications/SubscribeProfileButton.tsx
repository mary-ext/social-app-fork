import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { SubscribeProfileDialog } from '#/components/activity-notifications/SubscribeProfileDialog';
import { BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon } from '#/components/icons/BellPlus';
import { BellRinging_Filled_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

/** Round bell button opening the activity-subscription dialog. */
export function SubscribeProfileButton({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	const handle = Dialog.useDialogHandle();

	const name = createSanitizedDisplayName(profile, true);
	const isSubscribed =
		profile.viewer?.activitySubscription?.post || profile.viewer?.activitySubscription?.reply;
	const Icon = isSubscribed ? BellRingingIcon : BellPlusIcon;

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button color="secondary" label={l`Get notified when ${name} posts`} shape="round" size="small">
						<ButtonIcon icon={Icon} size="md" />
					</Button>
				}
			/>
			<SubscribeProfileDialog handle={handle} moderationOpts={moderationOpts} profile={profile} />
		</>
	);
}
