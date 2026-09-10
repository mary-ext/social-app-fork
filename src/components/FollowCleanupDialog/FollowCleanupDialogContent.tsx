import { useState } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';
import {
	type FlaggedFollow,
	type FollowIssue,
	followIssuesBySeverity,
	type ScanProgress,
} from '#/lib/follow-cleanup';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useBulkUnfollowMutation, useFollowCleanupScanQuery } from '#/state/queries/follow-cleanup';

import { formatCount } from '#/locale/intl/number';

import { BlankState } from '#/components/BlankState';
import * as Dialog from '#/components/Dialog';
import { ErrorState } from '#/components/ErrorState';
import { Checkbox } from '#/components/forms/Checkbox';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import * as TabScroller from '#/components/TabScroller';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';

import { FOLLOW_ISSUE_LABELS } from './follow-issue-labels';
import * as styles from './FollowCleanupDialog.css';
import { FollowRow } from './FollowRow';

const ROW_HEIGHT_ESTIMATE = 80;

const tallyIssues = (follows: readonly FlaggedFollow[]) => {
	const counts = new Map<FollowIssue, number>();
	for (const follow of follows) {
		for (const issue of follow.issues) {
			counts.set(issue, (counts.get(issue) ?? 0) + 1);
		}
	}
	return counts;
};

const keyExtractor = (item: FlaggedFollow) => item.did;

/**
 * renders the on-demand follow cleanup flow.
 *
 * @param props dialog handle for closing the flow
 * @returns the dialog header and cleanup content
 */
export const FollowCleanupDialogContent = ({ handle }: { handle: Dialog.DialogHandle }) => {
	return (
		<>
			<div className={styles.header}>
				<Text className={styles.title} numberOfLines={1} size="lg" weight="semiBold">
					{m['components.followCleanupDialog.title']()}
				</Text>
				<Button
					className={styles.closeButton}
					color="secondary"
					label={m['common.action.close']()}
					onClick={() => handle.close()}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<CleanupFlow />
		</>
	);
};

const CleanupFlow = () => {
	const [progress, setProgress] = useState<ScanProgress | undefined>(undefined);
	const [selected, setSelected] = useState<ReadonlySet<Did>>(() => new Set());
	const [filters, setFilters] = useState<readonly FollowIssue[]>([]);

	const moderationOpts = useModerationOpts();
	const confirmHandle = Prompt.usePromptHandle();
	const {
		mutateAsync: unfollow,
		isError: unfollowFailed,
		isPending: isUnfollowing,
		reset: resetUnfollow,
	} = useBulkUnfollowMutation();

	const { data, error, isFetching, refetch } = useFollowCleanupScanQuery({
		enabled: true,
		onProgress: setProgress,
	});

	const counts = tallyIssues(data ?? []);
	// ignore filters for categories emptied by an unfollow.
	const activeFilters = filters.filter((issue) => counts.has(issue));
	const shown =
		activeFilters.length === 0
			? (data ?? [])
			: (data ?? []).filter((follow) => follow.issues.some((issue) => activeFilters.includes(issue)));
	const selectedFollows = (data ?? []).filter((follow) => selected.has(follow.did));
	const allShownSelected = shown.length > 0 && shown.every((follow) => selected.has(follow.did));

	const startScan = () => {
		resetUnfollow();
		setFilters([]);
		setSelected(new Set());
		setProgress(undefined);
		void refetch();
	};

	const toggleSelected = (did: Did) => {
		setSelected((previous) => {
			const next = new Set(previous);
			if (!next.delete(did)) {
				next.add(did);
			}
			return next;
		});
	};

	const onConfirmUnfollow = async () => {
		const count = selectedFollows.length;
		try {
			await unfollow({ follows: selectedFollows });
			setSelected(new Set());
			Toast.show(m['components.followCleanupDialog.unfollowedToast']({ count }));
		} catch {
			Toast.show(m['components.followCleanupDialog.unfollowError'](), { type: 'error' });
		}
	};

	const selectedCount = selectedFollows.length;
	const unfollowLabel = m['components.followCleanupDialog.action.unfollow']({ count: selectedCount });
	const toggleSelectAll = () => {
		setSelected((previous) => {
			const next = new Set(previous);
			for (const follow of shown) {
				if (allShownSelected) {
					next.delete(follow.did);
				} else {
					next.add(follow.did);
				}
			}
			return next;
		});
	};

	if (isFetching) {
		return (
			<Dialog.Body className={styles.status} role="status">
				<Spinner color="default" label={m['components.followCleanupDialog.action.scan']()} size="xl" />
				{progress && (
					<Text color="textContrastMedium">
						{progress.phase === 'listing'
							? m['components.followCleanupDialog.progress.listing']({ count: progress.done })
							: m['components.followCleanupDialog.progress.checking']({
									done: progress.done,
									total: progress.total,
								})}
					</Text>
				)}
			</Dialog.Body>
		);
	}

	if (error || unfollowFailed) {
		return (
			<Dialog.Body>
				<ErrorState
					message={unfollowFailed ? m['components.followCleanupDialog.unfollowError']() : cleanError(error)}
					onRetry={startScan}
				/>
			</Dialog.Body>
		);
	}

	// profile cards need moderation options.
	if (!moderationOpts) {
		return (
			<Dialog.Body>
				<ProfileCard.LoadingPlaceholder />
			</Dialog.Body>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Dialog.Body>
				<BlankState icon={PeopleRemoveIcon} message={m['components.followCleanupDialog.empty']()} />
			</Dialog.Body>
		);
	}

	const selectAllLabel = allShownSelected
		? m['components.followCleanupDialog.action.clearSelection']()
		: m['components.followCleanupDialog.action.selectAll']();

	return (
		<>
			<Dialog.List
				data={shown}
				estimateHeight={ROW_HEIGHT_ESTIMATE}
				keyExtractor={keyExtractor}
				ListHeaderComponent={
					<div className={styles.listHeader}>
						<Text color="textContrastMedium" size="md">
							{m['components.followCleanupDialog.summary']({ count: data.length })}
						</Text>
						<div className={styles.selectionRow}>
							<Checkbox
								aria-label={selectAllLabel}
								checked={allShownSelected}
								className={styles.selectAll}
								disabled={isUnfollowing}
								indeterminate={!allShownSelected && shown.some((follow) => selected.has(follow.did))}
								onCheckedChange={toggleSelectAll}
							/>
							<div
								aria-label={m['components.followCleanupDialog.title']()}
								className={styles.chips}
								role="group"
							>
								<TabScroller.Root gutterWidth={0}>
									{followIssuesBySeverity
										.filter((issue) => counts.has(issue))
										.map((issue) => {
											const label = FOLLOW_ISSUE_LABELS[issue]();
											return (
												<TabScroller.Tab
													active={activeFilters.includes(issue)}
													aria-label={label}
													aria-pressed={activeFilters.includes(issue)}
													disabled={isUnfollowing}
													key={issue}
													onClick={() => {
														setFilters((previous) =>
															followIssuesBySeverity.filter((candidate) =>
																candidate === issue
																	? !previous.includes(candidate)
																	: previous.includes(candidate),
															),
														);
													}}
												>
													<TabScroller.TabText>{label}</TabScroller.TabText>
													<TabScroller.TabText size="sm" weight="normal">
														{formatCount(counts.get(issue)!)}
													</TabScroller.TabText>
												</TabScroller.Tab>
											);
										})}
								</TabScroller.Root>
							</div>
						</div>
					</div>
				}
				renderItem={({ item }) => (
					<FollowRow
						follow={item}
						moderationOpts={moderationOpts}
						isUnfollowing={isUnfollowing}
						onToggle={toggleSelected}
						selected={selected.has(item.did)}
					/>
				)}
			/>
			<Dialog.Footer>
				<div className={styles.footerContent}>
					<Text color="textContrastMedium" size="sm">
						{m['components.followCleanupDialog.selectionCount']({ count: selectedCount })}
					</Text>
					<Button
						color="negative"
						disabled={selectedCount === 0 || isUnfollowing}
						label={unfollowLabel}
						onClick={() => confirmHandle.open(null)}
						size="small"
						variant="solid"
					>
						{isUnfollowing && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
						<ButtonText>{unfollowLabel}</ButtonText>
					</Button>
				</div>
			</Dialog.Footer>
			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={unfollowLabel}
				description={m['components.followCleanupDialog.confirm.message']({ count: selectedCount })}
				handle={confirmHandle}
				onConfirm={() => void onConfirmUnfollow()}
				title={m['components.followCleanupDialog.confirm.title']()}
			/>
		</>
	);
};
