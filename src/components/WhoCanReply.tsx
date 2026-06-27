import { Fragment, useMemo, useRef } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { clsx } from 'clsx';

import { makeListLink, makeProfileLink } from '#/lib/routes/links';

import { type ThreadgateAllowUISetting, threadgateViewToAllowUISetting } from '#/state/queries/threadgate';

import { Trans } from '#/locale/Trans';

import {
	PostInteractionSettingsDialog,
	usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronDownIcon } from '#/components/icons/Chevron';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSignIcon } from '#/components/icons/CircleBanSign';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Group3_Stroke2_Corner0_Rounded as GroupIcon } from '#/components/icons/Group';
import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';

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
	const rootUri = (post.record as AppBskyFeedPost.Main).reply?.root?.uri ?? post.uri;
	const settings = useMemo(() => {
		return threadgateViewToAllowUISetting(post.threadgate);
	}, [post.threadgate]);

	const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
		postUri: post.uri,
		rootPostUri: rootUri,
	});
	const prefetchPromise = useRef<Promise<void>>(Promise.resolve());

	const prefetch = () => {
		prefetchPromise.current = prefetchPostInteractionSettings();
	};

	const anyoneCanReply = settings.length === 1 && settings[0]!.type === 'everybody';
	const noOneCanReply = settings.length === 1 && settings[0]!.type === 'nobody';
	const description = anyoneCanReply
		? m['components.whoCanReply.label.everybody']()
		: noOneCanReply
			? m['components.whoCanReply.label.disabled']()
			: m['components.whoCanReply.label.some']();

	const onPressOpen = () => {
		if (isThreadAuthor) {
			// wait on prefetch if it manages to resolve in under 200ms
			// otherwise, proceed immediately and show the spinner -sfn
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
					isThreadAuthor ? m['components.whoCanReply.action.edit']() : m['common.label.whoCanReply']()
				}
				className={clsx(css.trigger, isThreadAuthor && css.triggerAuthor)}
				onClick={onPressOpen}
				// prefetch the interaction settings so the edit dialog opens without a spinner
				onMouseEnter={isThreadAuthor ? prefetch : undefined}
			>
				<Icon width={16} settings={settings} />
				<Text
					className={css.label}
					size="md_sub"
					color={isThreadAuthor ? 'primary_500' : 'textContrastMedium'}
				>
					{description}
				</Text>
				{isThreadAuthor && <TinyChevronDownIcon width={8} fill="currentColor" />}
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
					settings={settings}
					embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
				/>
			)}
		</>
	);
}

function Icon({ width, settings }: { width?: number; settings: ThreadgateAllowUISetting[] }) {
	const isEverybody = settings.length === 0 || settings.every((setting) => setting.type === 'everybody');
	const isNobody = !!settings.find((gate) => gate.type === 'nobody');
	const IconComponent = isEverybody ? EarthIcon : isNobody ? CircleBanSignIcon : GroupIcon;
	return <IconComponent fill="currentColor" width={width} />;
}

function WhoCanReplyDialog({
	handle,
	post,
	settings,
	embeddingDisabled,
}: {
	handle: Dialog.DialogHandle;
	post: AppBskyFeedDefs.PostView;
	settings: ThreadgateAllowUISetting[];
	embeddingDisabled: boolean;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow" label={m['components.whoCanReply.a11y.dialog']()}>
				<div className={css.dialogContent}>
					<Text size="xl" weight="semiBold">
						{m['components.whoCanReply.title']()}
					</Text>
					<Rules post={post} settings={settings} embeddingDisabled={embeddingDisabled} />
				</div>
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Rules({
	post,
	settings,
	embeddingDisabled,
}: {
	post: AppBskyFeedDefs.PostView;
	settings: ThreadgateAllowUISetting[];
	embeddingDisabled: boolean;
}) {
	return (
		<>
			<Text size="md" color="textContrastMedium">
				{settings.length === 0 ? (
					m['components.whoCanReply.label.unknown']()
				) : settings[0]!.type === 'everybody' ? (
					m['components.whoCanReply.label.everybodyDesc']()
				) : settings[0]!.type === 'nobody' ? (
					m['components.whoCanReply.label.disabledDesc']()
				) : (
					<Trans
						message={m['components.whoCanReply.label.onlyRules']}
						markup={{
							t0: () => (
								<>
									{settings.map((rule, i) => (
										<Fragment key={`rule-${i}`}>
											<Rule rule={rule} post={post} lists={post.threadgate!.lists} />
											<Separator i={i} length={settings.length} />
										</Fragment>
									))}
								</>
							),
						}}
					/>
				)}{' '}
			</Text>
			{embeddingDisabled && (
				<Text size="md" color="textContrastMedium">
					{m['components.whoCanReply.label.noQuotes']()}
				</Text>
			)}
		</>
	);
}

function Rule({
	rule,
	post,
	lists,
}: {
	rule: ThreadgateAllowUISetting;
	post: AppBskyFeedDefs.PostView;
	lists: AppBskyGraphDefs.ListViewBasic[] | undefined;
}) {
	if (rule.type === 'mention') {
		return m['components.whoCanReply.label.mentionedUsers']();
	}
	if (rule.type === 'followers') {
		return (
			<Trans
				message={m['components.whoCanReply.label.following']}
				inputs={{ handle: post.author.handle }}
				markup={{
					t0: ({ children }) => (
						<InlineLinkText label={`@${post.author.handle}`} size="md_sub" to={makeProfileLink(post.author)}>
							{children}
						</InlineLinkText>
					),
				}}
			/>
		);
	}
	if (rule.type === 'following') {
		return (
			<Trans
				message={m['components.whoCanReply.label.followedBy']}
				inputs={{ handle: post.author.handle }}
				markup={{
					t0: ({ children }) => (
						<InlineLinkText label={`@${post.author.handle}`} size="md_sub" to={makeProfileLink(post.author)}>
							{children}
						</InlineLinkText>
					),
				}}
			/>
		);
	}
	if (rule.type === 'list') {
		const list = lists?.find((l) => l.uri === rule.list);
		if (list) {
			const listUrip = parseCanonicalResourceUri(list.uri);
			return (
				<Trans
					message={m['components.whoCanReply.label.listMembers']}
					inputs={{ name: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} size="md_sub" to={makeListLink(listUrip.repo, listUrip.rkey)}>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			);
		}
	}
}

function Separator({ i, length }: { i: number; length: number }) {
	if (length < 2 || i === length - 1) {
		return null;
	}
	if (i === length - 2) {
		return (
			<>
				{length > 2 ? ',' : ''} {m['components.whoCanReply.label.and']()}{' '}
			</>
		);
	}
	return <>, </>;
}
