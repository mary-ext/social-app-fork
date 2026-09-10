import { useState } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';

import { useBulkUnmuteMutation, useMutedAccountsScanQuery } from '#/state/queries/mute-cleanup';

import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

/**
 * confirms unmuting every muted account, scanning the list first to report how many there are.
 *
 * @param handle prompt handle for closing the prompt once unmuting settles
 * @returns the unmute-all confirmation prompt
 */
export function UnmuteAllPrompt({ handle }: { handle: Prompt.PromptHandle }) {
	return (
		<Prompt.Outer handle={handle}>
			<UnmuteAllPromptContent handle={handle} />
		</Prompt.Outer>
	);
}

function UnmuteAllPromptContent({ handle }: { handle: Prompt.PromptHandle }) {
	const [scanned, setScanned] = useState(0);
	const { data: dids, error } = useMutedAccountsScanQuery({ onProgress: setScanned });
	const { mutateAsync: unmuteAll, isPending: isUnmuting } = useBulkUnmuteMutation();

	const isScanning = !dids && !error;

	const description = error
		? cleanError(error)
		: dids?.length === 0
			? m['screens.moderation.mute.unmuteAll.empty']()
			: m['screens.moderation.mute.unmuteAll.description']({ count: dids?.length ?? scanned });

	const onConfirm = async (targets: Did[]) => {
		try {
			const { cleared, failed } = await unmuteAll({ dids: targets });
			if (failed > 0) {
				Toast.show(m['screens.moderation.mute.unmuteAll.partialError']({ count: failed }), {
					type: 'error',
				});
			} else {
				Toast.show(m['screens.moderation.mute.unmuteAll.unmutedToast']({ count: cleared.length }));
			}
			handle.close();
		} catch {
			Toast.show(m['screens.moderation.mute.unmuteAll.error'](), { type: 'error' });
		}
	};

	return (
		<>
			<Prompt.Content>
				<Prompt.TitleText>{m['screens.moderation.mute.unmuteAll.title']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{description}</Prompt.DescriptionText>
			</Prompt.Content>

			<Prompt.Actions>
				{isScanning ? (
					<Button
						color="negative"
						disabled
						label={m['screens.moderation.mute.unmuteAll.action']()}
						size="large"
						variant="solid"
					>
						<ButtonSpinner label={m['common.status.loading']()} />
					</Button>
				) : (
					<Prompt.Action
						color="negative"
						cta={m['screens.moderation.mute.unmuteAll.action']()}
						disabled={isUnmuting || !dids?.length}
						icon={isUnmuting ? UnmuteSpinner : undefined}
						onPress={() => {
							if (dids?.length) {
								void onConfirm(dids);
							}
						}}
						shouldCloseOnPress={false}
					/>
				)}
				<Prompt.Cancel />
			</Prompt.Actions>
		</>
	);
}

function UnmuteSpinner() {
	return <Spinner color="white" label={m['common.status.loading']()} size="sm" />;
}
