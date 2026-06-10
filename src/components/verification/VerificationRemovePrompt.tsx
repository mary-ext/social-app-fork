import { useCallback } from 'react';
import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import { useVerificationsRemoveMutation } from '#/state/queries/verification/useVerificationsRemoveMutation';

import { logger } from '#/logger';

import type { DialogControlProps } from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

export { useDialogControl as usePromptControl } from '#/components/Dialog';

export function VerificationRemovePrompt({
	control,
	profile,
	verifications,
	onConfirm: onConfirmInner,
}: {
	control: DialogControlProps;
	profile: AnyProfileView;
	verifications: AppBskyActorDefs.VerificationView[];
	onConfirm?: () => void;
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
			control={control}
			title={l`Remove your verification for this account?`}
			onConfirm={() => void onConfirm()}
			confirmButtonCta={l`Remove verification`}
			confirmButtonColor="negative"
		/>
	);
}
