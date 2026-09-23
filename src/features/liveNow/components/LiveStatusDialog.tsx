import { lazy, Suspense } from 'react';

import type { AnyProfileView, AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';

import { profileTarget } from '#/lib/routes/targets';

import * as css from '#/features/liveNow/components/LiveStatusDialog.css';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

const LiveStatus = lazy(() =>
	import('#/features/liveNow/components/LiveStatus').then((mod) => ({ default: mod.LiveStatus })),
);

/**
 * A touch-only dialog that surfaces a live status (no hover affordance on touch devices). Open it
 * imperatively through `handle.open()`.
 */
export function LiveStatusDialog({
	embed,
	handle,
	profile,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	status: AppBskyActorDefs.StatusView;
}) {
	const router = useRouter();

	const onPressOpenProfile = () => {
		handle.close();
		router.navigate({ to: profileTarget(profile.did) });
	};

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				className={css.dialogPopup}
				label={m['features.liveNow.badge.userIsLive']({ handle: profile.handle })}
				padding="none"
				size="narrow"
			>
				<Suspense fallback={<Dialog.Loading />}>
					<LiveStatus
						embed={embed}
						onPressOpenProfile={onPressOpenProfile}
						onRequestClose={() => handle.close()}
						profile={profile}
						status={status}
					/>
				</Suspense>
				<Dialog.Close variant="floating" />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
