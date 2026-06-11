import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useSession } from '#/state/session';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { LabelsOnMeDialog, useLabelsOnMeDialogControl } from '#/components/moderation/LabelsOnMeDialog';
import { Button, ButtonIcon, type ButtonProps, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import * as styles from './LabelsOnMe.css';

export function LabelsOnMe({
	className,
	labels,
	size,
	type,
}: {
	className?: string;
	labels: ComAtprotoLabelDefs.Label[] | undefined;
	size?: ButtonProps['size'];
	type: 'account' | 'content';
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const control = useLabelsOnMeDialogControl();

	if (!labels || !currentAccount) {
		return null;
	}
	const filtered = labels.filter(
		(label) => !label.val.startsWith('!') && !(label.val === 'bot' && label.src === currentAccount.did),
	);
	if (!filtered.length) {
		return null;
	}

	return (
		<div className={clsx(styles.row, className)}>
			<LabelsOnMeDialog control={control} labels={filtered} type={type} />
			<Dialog.Trigger
				handle={control}
				render={
					<Button
						color="secondary"
						label={l`View information about these labels`}
						size={size ?? 'small'}
						variant="solid"
					>
						<ButtonIcon icon={CircleInfo} />
						<ButtonText>
							{type === 'account' ? (
								<Trans>
									<Plural value={filtered.length} one="# label has" other="# labels have" /> been placed on
									this account
								</Trans>
							) : (
								<Trans>
									<Plural value={filtered.length} one="# label has" other="# labels have" /> been placed on
									this content
								</Trans>
							)}
						</ButtonText>
					</Button>
				}
			/>
		</div>
	);
}

export function LabelsOnMyPost({ className, post }: { className?: string; post: AppBskyFeedDefs.PostView }) {
	const { currentAccount } = useSession();
	if (post.author.did !== currentAccount?.did) {
		return null;
	}
	return <LabelsOnMe className={className} labels={post.labels} size="tiny" type="content" />;
}
