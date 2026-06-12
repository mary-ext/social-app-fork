import { useCallback } from 'react';
import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import { useVerificationsRemoveMutation } from '#/state/queries/verification/useVerificationsRemoveMutation';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';
import * as Prompt from '#/components/web/Prompt';

export function VerificationRemovePrompt({
	handle,
	onConfirm: onConfirmInner,
	profile,
	verifications,
}: {
	handle: Prompt.PromptHandle;
	onConfirm?: () => void;
	profile: AnyProfileView;
	verifications: AppBskyActorDefs.VerificationView[];
}) {
	const { t: l } = useLingui();
	const { mutateAsync: remove } = useVerificationsRemoveMutation();
	const onConfirm = useCallback(async () => {
		onConfirmInner?.();
		try {
			await remove({ profile, verifications });
			Toast.show(l`Removed verification`);
		} catch (e) {
			Toast.show(l`Failed to remove verification`, {
				type: 'error',
			});
			logger.error('Failed to remove verification', {
				safeMessage: e,
			});
		}
	}, [l, profile, verifications, remove, onConfirmInner]);

	return (
		<Prompt.Basic
			confirmButtonColor="negative"
			confirmButtonCta={l`Remove verification`}
			handle={handle}
			onConfirm={() => void onConfirm()}
			title={l`Remove your verification for this account?`}
		/>
	);
}
