import { Fragment, type ReactNode, useRef } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { clsx } from 'clsx';

import { getPostRecord } from '#/lib/api/record-casts';
import { type ReplyAudience, type ReplyGroups, repliesFromThreadgateView } from '#/lib/interaction-settings';
import { listTarget, profileTarget } from '#/lib/routes/targets';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import {
	PostInteractionSettingsDialog,
	usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import TinyChevronDownIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import CircleBanSignIcon from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import GroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './WhoCanReply.css';

interface WhoCanReplyProps {
	post: AppBskyFeedDefs.PostView;
	isThreadAuthor: boolean;
}

export function WhoCanReply({ post, isThreadAuthor }: WhoCanReplyProps) {
	const infoDialogHandle = Dialog.useDialogHandle();
	const editDialogHandle = Dialog.useDialogHandle();

	/*
	 * `WhoCanReply` is only used for root posts atm, in case this changes
	 * unexpectedly, we should check to make sure it's for sure the root URI.
	 */
	const record = getPostRecord(post);
	const rootUri = record.reply?.root?.uri ?? post.uri;
	const replies = repliesFromThreadgateView(post.threadgate);

	const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
		postUri: post.uri,
		rootPostUri: rootUri,
	});
	const prefetchPromise = useRef<Promise<void>>(Promise.resolve());

	const prefetch = () => {
		prefetchPromise.current = prefetchPostInteractionSettings();
	};

	const onPressOpen = () => {
		if (isThreadAuthor) {
			// wait briefly for prefetch, then open while showing the spinner.
			void Promise.race([prefetchPromise.current, new Promise((res) => setTimeout(res, 200))]).finally(() => {
				editDialogHandle.open(null);
			});
		} else {
			infoDialogHandle.open(null);
		}
	};

	return (
		<>
			<button
				type="button"
				aria-label={
					isThreadAuthor ? m['components.whoCanReply.edit']() : m['common.interaction.whoCanReply']()
				}
				className={clsx(css.trigger, isThreadAuthor && css.triggerAuthor)}
				onClick={onPressOpen}
				// prefetch the interaction settings so the edit dialog opens without a spinner
				onMouseEnter={isThreadAuthor ? prefetch : undefined}
			>
				<Icon replies={replies} />
				<Text className={css.label} size="md_sub" color={isThreadAuthor ? 'textLink' : 'textContrastMedium'}>
					{getReplyAudienceSummary(replies)}
				</Text>
				{isThreadAuthor && <TinyChevronDownIcon className={css.tinyChevronDownIcon} />}
			</button>
			{isThreadAuthor ? (
				<PostInteractionSettingsDialog
					postUri={post.uri}
					rootPostUri={rootUri}
					handle={editDialogHandle}
					initialThreadgateView={post.threadgate}
				/>
			) : (
				<WhoCanReplyDialog
					handle={infoDialogHandle}
					post={post}
					replies={replies}
					embeddingDisabled={!!post.viewer?.embeddingDisabled}
				/>
			)}
		</>
	);
}

/**
 * labels replies as open, disabled, or restricted.
 *
 * @param replies the reply audience
 * @returns the localized summary
 */
export const getReplyAudienceSummary = (replies: ReplyAudience): string => {
	switch (replies.type) {
		case 'anyone': {
			return m['components.whoCanReply.summary.everybody.label']();
		}
		case 'nobody': {
			return m['components.whoCanReply.summary.disabled.label']();
		}
		case 'some': {
			return m['components.whoCanReply.summary.some']();
		}
	}
};

const AUDIENCE_ICONS = {
	anyone: EarthIcon,
	nobody: CircleBanSignIcon,
	some: GroupIcon,
} satisfies Record<ReplyAudience['type'], unknown>;

function Icon({ replies }: { replies: ReplyAudience }) {
	const IconComponent = AUDIENCE_ICONS[replies.type];
	return <IconComponent className={css.gateIcon} />;
}

function WhoCanReplyDialog({
	handle,
	post,
	replies,
	embeddingDisabled,
}: {
	handle: Dialog.DialogHandle;
	post: AppBskyFeedDefs.PostView;
	replies: ReplyAudience;
	embeddingDisabled: boolean;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Stack gap="sm">
					<Dialog.TitleRow>
						<Dialog.Title>{m['components.whoCanReply.title']()}</Dialog.Title>
						<Dialog.Close />
					</Dialog.TitleRow>
					<Rules post={post} replies={replies} embeddingDisabled={embeddingDisabled} />
				</Stack>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Rules({
	post,
	replies,
	embeddingDisabled,
}: {
	post: AppBskyFeedDefs.PostView;
	replies: ReplyAudience;
	embeddingDisabled: boolean;
}) {
	let summary: ReactNode;
	switch (replies.type) {
		case 'anyone': {
			summary = m['components.whoCanReply.summary.everybody.description']();
			break;
		}
		case 'nobody': {
			summary = m['components.whoCanReply.summary.disabled.description']();
			break;
		}
		case 'some': {
			const rules = getRuleNodes(post, replies);
			summary =
				rules.length === 0 ? (
					m['components.whoCanReply.summary.unknown']()
				) : (
					<Trans
						message={m['components.whoCanReply.rules.template']}
						markup={{
							t0: () => (
								<>
									{rules.map(({ key, node }, i) => (
										<Fragment key={key}>
											{node}
											<Separator i={i} length={rules.length} />
										</Fragment>
									))}
								</>
							),
						}}
					/>
				);
			break;
		}
	}

	return (
		<>
			<Text size="md" color="textContrastMedium">
				{summary}{' '}
			</Text>
			{embeddingDisabled && (
				<Text size="md" color="textContrastMedium">
					{m['components.whoCanReply.quote.noOne']()}
				</Text>
			)}
		</>
	);
}

// deleted lists may remain in the rules but have no view to display.
const getRuleNodes = (
	post: AppBskyFeedDefs.PostView,
	replies: ReplyGroups,
): { key: string; node: ReactNode }[] => {
	const rules: { key: string; node: ReactNode }[] = [];

	if (replies.mentioned) {
		rules.push({ key: 'mentioned', node: m['components.whoCanReply.rules.mentioned']() });
	}

	const authorRules = [
		{ enabled: replies.followers, key: 'followers', message: m['components.whoCanReply.rules.following'] },
		{ enabled: replies.following, key: 'following', message: m['components.whoCanReply.rules.followedBy'] },
	];
	for (const { enabled, key, message } of authorRules) {
		if (!enabled) {
			continue;
		}

		rules.push({
			key,
			node: (
				<Trans
					message={message}
					inputs={{ handle: post.author.handle }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText
								label={`@${post.author.handle}`}
								size="md_sub"
								to={profileTarget(post.author.did)}
							>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			),
		});
	}
	for (const uri of replies.lists) {
		const list = post.threadgate?.lists?.find((l) => l.uri === uri);
		if (!list) {
			continue;
		}

		const listUrip = parseCanonicalResourceUri(list.uri);
		rules.push({
			key: uri,
			node: (
				<Trans
					message={m['components.whoCanReply.rules.listMembers']}
					inputs={{ name: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} size="md_sub" to={listTarget(listUrip.repo, listUrip.rkey)}>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			),
		});
	}

	return rules;
};

function Separator({ i, length }: { i: number; length: number }) {
	if (length < 2 || i === length - 1) {
		return null;
	}
	if (i === length - 2) {
		return (
			<>
				{length > 2 ? ',' : ''} {m['components.whoCanReply.rules.and']()}{' '}
			</>
		);
	}
	return <>, </>;
}
