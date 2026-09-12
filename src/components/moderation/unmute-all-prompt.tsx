import { useState } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';
import { useConstant } from '#/lib/hooks/use-constant';
import { createRateLimitBudget } from '#/lib/rate-limit-budget';

import { useBulkUnmuteMutation, useMutedAccountsScanQuery } from '#/state/queries/mute-cleanup';

import { ProgressBar } from '#/components/ProgressBar';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './unmute-all-prompt.css';

/**
 * confirms unmuting all accounts and displays scan and unmute progress.
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
	const [attempted, setAttempted] = useState(0);

	// scans and unmutes share the per-IP limit.
	const budget = useConstant(() => createRateLimitBudget());
	const { data: dids, error } = useMutedAccountsScanQuery({ budget, onProgress: setScanned });
	const {
		cancel: stopUnmuting,
		isPending: isUnmuting,
		mutateAsync: unmuteAll,
	} = useBulkUnmuteMutation({ budget, onProgress: setAttempted });

	const isScanning = !dids && !error;

	const onConfirm = async (targets: Did[]) => {
		try {
			const { cancelled, failed } = await unmuteAll({ dids: targets });
			if (!cancelled && failed > 0) {
				Toast.show(m['screens.moderation.mute.unmuteAll.partialError']({ count: failed }), {
					type: 'error',
				});
			}
			handle.close();
		} catch {
			Toast.show(m['screens.moderation.mute.unmuteAll.error'](), { type: 'error' });
		}
	};

	if (isUnmuting) {
		const total = dids?.length ?? 0;
		const progressLabel = m['screens.moderation.mute.unmuteAll.progressLabel']();
		const progressText = m['screens.moderation.mute.unmuteAll.progress']({ done: attempted, total });

		return (
			<>
				<Prompt.Content>
					<Prompt.TitleText>{progressLabel}</Prompt.TitleText>
					<Prompt.DescriptionText>{progressText}</Prompt.DescriptionText>
					<div className={styles.progress}>
						<ProgressBar label={progressLabel} max={total} value={attempted} valueText={progressText} />
					</div>
				</Prompt.Content>

				<Prompt.Actions>
					<Prompt.Action
						color="secondary"
						cta={m['screens.moderation.mute.unmuteAll.stop']()}
						onPress={stopUnmuting}
						shouldCloseOnPress={false}
					/>
				</Prompt.Actions>
			</>
		);
	}

	const description = error
		? cleanError(error)
		: dids?.length === 0
			? m['screens.moderation.mute.unmuteAll.empty']()
			: m['screens.moderation.mute.unmuteAll.description']({ count: dids?.length ?? scanned });

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
						disabled={!dids?.length}
						onPress={() => {
							if (dids?.length) {
								setAttempted(0);
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
