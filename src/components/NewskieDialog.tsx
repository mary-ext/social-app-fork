import { lazy, Suspense } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { differenceInSeconds } from '@mary/date-fns';

import { useConstant } from '#/lib/hooks/use-constant';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/NewskieDialog.css';

import Newskie from '#/icons/central-custom/Newskie_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const NewskieDialogBody = lazy(() =>
	import('#/components/NewskieDialogBody').then((mod) => ({ default: mod.NewskieDialogBody })),
);

export function NewskieDialog({
	profile,
	disabled,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	disabled?: boolean;
}) {
	const handle = Dialog.useDialogHandle();

	const createdAt = profile.createdAt;
	const now = useConstant(() => new Date());
	const daysOld = createdAt ? differenceInSeconds(now, new Date(createdAt)) / 86400 : Infinity;

	if (!createdAt || daysOld > 7) {
		return null;
	}

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Trigger
				aria-label={m['components.newskieDialog.a11y.hint']()}
				className={styles.trigger}
				disabled={disabled}
			>
				<Newskie className={styles.triggerIcon} />
			</Dialog.Trigger>
			<Dialog.Popup size="narrow" label={m['components.newskieDialog.a11y.label']()}>
				<Suspense fallback={<Dialog.Loading />}>
					<NewskieDialogBody
						profile={profile}
						createdAt={createdAt}
						now={now}
						onClose={() => handle.close()}
					/>
				</Suspense>
				<Dialog.Close variant="floating" />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
