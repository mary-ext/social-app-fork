import { useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { RadioGroup } from '@base-ui/react/radio-group';

import { createPostgateRecord, embeddingRules } from '#/state/queries/postgate/util';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import {
	coalesceAllowUISettings,
	getThreadgateReplyMode,
	type ThreadgateReplyMode,
} from '#/state/queries/threadgate/util';

import { formatCount } from '#/locale/intl/number';

import * as Settings from '#/components/Settings';
import { Text } from '#/components/Text';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import QuoteIcon from '#/icons/central/CloseQuote2_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './SettingsForm.css';

type ReplyGroup = 'followers' | 'following' | 'mention';

const isReplyGroup = (value: string): value is ReplyGroup => {
	return value === 'followers' || value === 'following' || value === 'mention';
};

export type PostInteractionSettingsFormProps = {
	postgate: AppBskyFeedPostgate.Main;
	onChangePostgate: (v: AppBskyFeedPostgate.Main) => void;

	threadgateAllowUISettings: ThreadgateAllowUISetting[];
	onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void;

	onOpenLists: () => void;
	replySettingsDisabled?: boolean;
};

/**
 * reply and quote settings. includes row padding; render without horizontal container padding.
 *
 * @param props.postgate current postgate record
 * @param props.onChangePostgate receives the updated postgate record
 * @param props.threadgateAllowUISettings current reply settings
 * @param props.onChangeThreadgateAllowUISettings receives the updated reply settings
 * @param props.onOpenLists opens the picker for lists whose members can reply
 * @param props.replySettingsDisabled shows reply settings as a read-only summary
 * @returns the settings list
 */
export function PostInteractionSettingsForm({
	postgate,
	onChangePostgate,
	threadgateAllowUISettings,
	onChangeThreadgateAllowUISettings,
	onOpenLists,
	replySettingsDisabled,
}: PostInteractionSettingsFormProps) {
	const quotesEnabled = !postgate.embeddingRules?.some((v) => v.$type === embeddingRules.disableRule.$type);

	const onChangeQuotesEnabled = (enabled: boolean) => {
		onChangePostgate(
			createPostgateRecord({
				...postgate,
				embeddingRules: enabled ? [] : [embeddingRules.disableRule],
			}),
		);
	};

	return (
		<Settings.List surface="flush">
			<Settings.Section titleText={m['common.interaction.whoCanReply']()}>
				{replySettingsDisabled ? (
					<LockedReplyRow settings={threadgateAllowUISettings} />
				) : (
					<ReplyRows
						onChange={onChangeThreadgateAllowUISettings}
						onOpenLists={onOpenLists}
						settings={threadgateAllowUISettings}
					/>
				)}
			</Settings.Section>

			<Settings.Section titleText={m['components.dialogs.interaction.quote.title']()}>
				<Settings.SwitchRow
					label={
						quotesEnabled
							? m['components.dialogs.interaction.quote.disable']()
							: m['components.dialogs.interaction.quote.enable']()
					}
					onChange={onChangeQuotesEnabled}
					value={quotesEnabled}
				>
					<Settings.Icon icon={QuoteIcon} />
					<Settings.Label
						subtitleText={m['components.dialogs.interaction.quote.description']()}
						titleText={m['components.dialogs.interaction.quote.allow']()}
					/>
				</Settings.SwitchRow>
			</Settings.Section>
		</Settings.List>
	);
}

function ReplyRows({
	onChange,
	onOpenLists,
	settings,
}: {
	onChange: (v: ThreadgateAllowUISetting[]) => void;
	onOpenLists: () => void;
	settings: ThreadgateAllowUISetting[];
}) {
	const mode = getThreadgateReplyMode(settings);
	const groups = settings.flatMap((v) => (isReplyGroup(v.type) ? [v.type] : []));
	const lists = settings.filter((v) => v.type === 'list');

	// arrow keys select radios as they move, so passing through anyone/nobody must not discard the groups
	const [lastSome, setLastSome] = useState(settings);
	if (mode === 'some' && lastSome !== settings) {
		setLastSome(settings);
	}

	const onChangeMode = (next: ThreadgateReplyMode) => {
		switch (next) {
			case 'anyone': {
				onChange([{ type: 'everybody' }]);
				break;
			}
			case 'nobody': {
				onChange([{ type: 'nobody' }]);
				break;
			}
			case 'some': {
				onChange(getThreadgateReplyMode(lastSome) === 'some' ? lastSome : [{ type: 'mention' }]);
				break;
			}
		}
	};

	const onChangeGroups = (values: string[]) => {
		onChange(coalesceAllowUISettings([...values.filter(isReplyGroup).map((type) => ({ type })), ...lists]));
	};

	// keep checkboxes outside the radio group's roving focus. CSS places them between "some" and "nobody".
	return (
		<>
			<RadioGroup<ThreadgateReplyMode>
				aria-label={m['components.dialogs.reply.description']()}
				className={styles.radioGroup}
				onValueChange={onChangeMode}
				value={mode}
			>
				<Settings.RadioRow label={m['components.dialogs.reply.allowAnyone']()} value="anyone">
					<Settings.Label
						subtitleText={m['components.dialogs.reply.anyoneDescription']()}
						titleText={m['components.dialogs.reply.anyone']()}
					/>
				</Settings.RadioRow>
				<Settings.RadioRow label={m['components.dialogs.reply.some']()} value="some">
					<Settings.Label
						subtitleText={m['components.dialogs.reply.someDescription']()}
						titleText={m['components.dialogs.reply.some']()}
					/>
				</Settings.RadioRow>
				<Settings.RadioRow
					className={styles.afterNest}
					label={m['components.dialogs.reply.disableAll']()}
					value="nobody"
				>
					<Settings.Label
						subtitleText={m['components.dialogs.reply.nobodyDescription']()}
						titleText={m['components.dialogs.reply.nobody']()}
					/>
				</Settings.RadioRow>
			</RadioGroup>
			{mode === 'some' && (
				<CheckboxGroup
					aria-label={m['components.dialogs.reply.advancedDescription']()}
					className={styles.nest}
					onValueChange={onChangeGroups}
					render={<Settings.Group />}
					value={groups}
				>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowFollowers']()} value="followers">
						<Settings.Label titleText={m['components.dialogs.reply.followers']()} />
					</Settings.CheckboxRow>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowFollows']()} value="following">
						<Settings.Label titleText={m['components.dialogs.reply.peopleYouFollow']()} />
					</Settings.CheckboxRow>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowMentions']()} value="mention">
						<Settings.Label titleText={m['components.dialogs.reply.peopleYouMention']()} />
					</Settings.CheckboxRow>
					<Settings.ButtonRow label={m['components.dialogs.reply.lists']()} onPress={onOpenLists}>
						<Settings.Icon icon={ListIcon} />
						<Settings.Label titleText={m['components.dialogs.reply.lists']()} />
						{lists.length > 0 && (
							<Text className={styles.pill} size="sm" weight="semiBold">
								{formatCount(lists.length)}
							</Text>
						)}
					</Settings.ButtonRow>
				</CheckboxGroup>
			)}
		</>
	);
}

function LockedReplyRow({ settings }: { settings: ThreadgateAllowUISetting[] }) {
	let summary: string;
	switch (getThreadgateReplyMode(settings)) {
		case 'anyone': {
			summary = m['components.whoCanReply.summary.everybody.label']();
			break;
		}
		case 'nobody': {
			summary = m['components.whoCanReply.summary.disabled.label']();
			break;
		}
		case 'some': {
			summary = m['components.whoCanReply.summary.some']();
			break;
		}
	}

	return (
		<Settings.StaticRow>
			<Settings.Icon icon={LockIcon} />
			<Settings.Label subtitleText={m['components.dialogs.reply.authorControlled']()} titleText={summary} />
		</Settings.StaticRow>
	);
}
