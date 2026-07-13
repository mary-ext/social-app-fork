import { useState } from 'react';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { type ActiveConvoStates, useConvoActive } from '#/state/messages/convo';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';
import type { SessionAccount } from '#/state/session/types';

import * as Dialog from '#/components/Dialog';
import { filterBlockedReactions } from '#/components/dms/util';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as TabScroller from '#/components/TabScroller';
import { tabLabel } from '#/components/TabScroller.css';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

import * as css from './ReactionsDialog.css';

type Reaction = {
	key: string;
	value: string;
	senders: ChatBskyConvoDefs.ReactionViewSender[];
	count: number;
};

type Tab = Omit<Reaction, 'senders'>;

export function ReactionsDialog({ handle }: { handle: Dialog.DialogHandle<ChatBskyConvoDefs.MessageView> }) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: ChatBskyConvoDefs.MessageView | undefined }) =>
				payload ? (
					<Dialog.Popup size="medium" label={m['components.dms.reaction.title']()} scroll="body">
						<DialogInner close={() => handle.close()} message={payload} />
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}

function DialogInner({
	close,
	message: snapshot,
}: {
	close: () => void;
	message: ChatBskyConvoDefs.MessageView;
}) {
	const { currentAccount } = useSession();
	const convo = useConvoActive();
	const moderationOpts = useModerationOpts();

	const [selected, setSelected] = useState('all');

	// `snapshot` is frozen from when the dialog opened; read the live message out of the convo items so
	// optimistic reaction removals (e.g. "Tap to remove") reflect without reopening.
	let message = snapshot;
	for (const item of convo.items) {
		if ((item.type === 'message' || item.type === 'pending-message') && item.message.id === snapshot.id) {
			message = item.message;
			break;
		}
	}

	const reactions = filterBlockedReactions(message.reactions, convo.relatedProfiles);
	const groupedReactions = groupReactions(reactions);

	const filteredReactions = reactions
		.filter((r) => selected === 'all' || r.value === selected)
		// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `filter` just returned
		.sort((a, b) => {
			if (a.sender.did === currentAccount?.did) return -1;
			if (b.sender.did === currentAccount?.did) return 1;
			return 0;
		});

	const tabs: Tab[] = [
		{ key: 'all', value: m['common.status.all'](), count: reactions.length },
		...groupedReactions,
	];

	return (
		<>
			<div className={css.header}>
				<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
					{m['components.dms.reaction.title']()}
				</Text>
				<Button
					className={css.closeButton}
					color="secondary"
					label={m['common.action.close']()}
					onClick={close}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<div className={css.tabs}>
				<TabScroller.Root activeKey={selected} gutterWidth={space.lg}>
					{tabs.map((tab) => (
						<TabScroller.Tab
							active={selected === tab.key}
							aria-label={
								tab.key === 'all'
									? m['components.dms.reaction.a11y.showAll']()
									: m['components.dms.reaction.a11y.show']({ value: tab.value })
							}
							key={tab.key}
							onClick={() => setSelected(tab.key)}
						>
							<Text className={tabLabel} size="md_sub" weight="medium">
								{tab.value}
							</Text>
							<Text className={tabLabel} size="md_sub" weight="medium">
								{tab.count}
							</Text>
						</TabScroller.Tab>
					))}
				</TabScroller.Root>
			</div>

			<Dialog.List
				className={css.list}
				data={filteredReactions}
				keyExtractor={(reaction) => reaction.sender.did + '-' + reaction.value}
				renderItem={(reaction) => {
					const sender = convo.relatedProfiles.get(reaction.sender.did);
					if (!sender || !moderationOpts) return null;
					return (
						<ReactionRow
							allReactions={reactions}
							close={close}
							convo={convo}
							currentAccount={currentAccount}
							message={message}
							moderationOpts={moderationOpts}
							profile={sender}
							reaction={reaction}
							selected={selected}
							setSelected={setSelected}
						/>
					);
				}}
			/>
		</>
	);
}

function ReactionRow({
	allReactions,
	close,
	convo,
	currentAccount,
	message,
	moderationOpts,
	profile,
	reaction,
	selected,
	setSelected,
}: {
	allReactions: ChatBskyConvoDefs.ReactionView[];
	close: () => void;
	convo: ActiveConvoStates;
	currentAccount?: SessionAccount;
	message: ChatBskyConvoDefs.MessageView;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	reaction: ChatBskyConvoDefs.ReactionView;
	selected: string;
	setSelected: React.Dispatch<React.SetStateAction<string>>;
}) {
	const isFromSelf = currentAccount?.did === profile.did;

	const onPress = () => {
		const remainingReactions = allReactions.filter(
			(r) => !(r.value === reaction.value && r.sender.did === currentAccount?.did),
		);

		if (remainingReactions.length === 0) {
			close();
		} else if (selected !== 'all' && !remainingReactions.some((r) => r.value === reaction.value)) {
			// the tab we're viewing no longer exists; fall back to "all"
			setSelected('all');
		}

		convo
			.removeReaction(message.id, reaction.value)
			.catch(() => Toast.show(m['components.dms.reaction.error.remove']()));
	};

	const inner = (
		<ProfileCard.Header>
			<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
			<div className={css.nameColumn}>
				<ProfileCard.Handle profile={profile} />
				{isFromSelf ? (
					<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
						{m['components.dms.reaction.a11y.remove']()}
					</Text>
				) : (
					<ProfileCard.Name moderationOpts={moderationOpts} profile={profile} />
				)}
			</div>
			<span className={css.emojiGlyph}>{reaction.value}</span>
		</ProfileCard.Header>
	);

	if (isFromSelf) {
		return (
			<button
				type="button"
				aria-label={m['components.dms.reaction.a11y.removeReaction']({ value: reaction.value })}
				className={css.rowButton}
				onClick={onPress}
			>
				{inner}
			</button>
		);
	}

	return <ProfileCard.Outer className={css.row}>{inner}</ProfileCard.Outer>;
}

export function groupReactions(reactions: ChatBskyConvoDefs.ReactionView[] | undefined): Reaction[] {
	const grouped = new Map<string, Reaction>();
	for (const reaction of reactions ?? []) {
		if (!reaction) continue;
		const existing = grouped.get(reaction.value);
		if (existing) {
			existing.senders.push(reaction.sender);
			existing.count++;
		} else {
			grouped.set(reaction.value, {
				key: reaction.value,
				value: reaction.value,
				senders: [reaction.sender],
				count: 1,
			});
		}
	}
	return Array.from(grouped.values());
}
