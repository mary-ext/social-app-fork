import { type ReactNode, useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Switch } from '@base-ui/react/switch';
import { clsx } from 'clsx';

import { createPostgateRecord, embeddingRules } from '#/state/queries/postgate/util';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import {
	coalesceAllowUISettings,
	getThreadgateReplyMode,
	type ThreadgateReplyMode,
} from '#/state/queries/threadgate/util';

import { formatCount } from '#/locale/intl/number';

import { Text } from '#/components/Text';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
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
		<div className={styles.form}>
			<SectionHeader>{m['common.interaction.whoCanReply']()}</SectionHeader>
			{replySettingsDisabled ? (
				<LockedReplyRow settings={threadgateAllowUISettings} />
			) : (
				<ReplyRows
					onChange={onChangeThreadgateAllowUISettings}
					onOpenLists={onOpenLists}
					settings={threadgateAllowUISettings}
				/>
			)}

			<SectionHeader>{m['components.dialogs.interaction.quote.title']()}</SectionHeader>
			<Switch.Root
				aria-label={
					quotesEnabled
						? m['components.dialogs.interaction.quote.disable']()
						: m['components.dialogs.interaction.quote.enable']()
				}
				checked={quotesEnabled}
				className={styles.row}
				onCheckedChange={onChangeQuotesEnabled}
			>
				<QuoteIcon className={styles.icon} />
				<RowLabel
					subtitle={m['components.dialogs.interaction.quote.description']()}
					title={m['components.dialogs.interaction.quote.allow']()}
				/>
				<span className={styles.switchTrack}>
					<span className={styles.switchThumb} />
				</span>
			</Switch.Root>
		</div>
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
		<div className={styles.replyRows}>
			<RadioGroup<ThreadgateReplyMode>
				aria-label={m['components.dialogs.reply.description']()}
				className={styles.radioGroup}
				onValueChange={onChangeMode}
				value={mode}
			>
				<RadioRow
					label={m['components.dialogs.reply.allowAnyone']()}
					subtitle={m['components.dialogs.reply.anyoneDescription']()}
					title={m['components.dialogs.reply.anyone']()}
					value="anyone"
				/>
				<div className={styles.divider} />
				<RadioRow
					label={m['components.dialogs.reply.some']()}
					subtitle={m['components.dialogs.reply.someDescription']()}
					title={m['components.dialogs.reply.some']()}
					value="some"
				/>
				{mode !== 'some' && <div className={clsx(styles.divider, styles.afterNest)} />}
				<RadioRow
					className={styles.afterNest}
					label={m['components.dialogs.reply.disableAll']()}
					subtitle={m['components.dialogs.reply.nobodyDescription']()}
					title={m['components.dialogs.reply.nobody']()}
					value="nobody"
				/>
			</RadioGroup>
			{mode === 'some' && (
				<CheckboxGroup
					aria-label={m['components.dialogs.reply.advancedDescription']()}
					className={styles.nest}
					onValueChange={onChangeGroups}
					value={groups}
				>
					<CheckboxRow
						label={m['components.dialogs.reply.allowFollowers']()}
						title={m['components.dialogs.reply.followers']()}
						value="followers"
					/>
					<div className={styles.divider} />
					<CheckboxRow
						label={m['components.dialogs.reply.allowFollows']()}
						title={m['components.dialogs.reply.peopleYouFollow']()}
						value="following"
					/>
					<div className={styles.divider} />
					<CheckboxRow
						label={m['components.dialogs.reply.allowMentions']()}
						title={m['components.dialogs.reply.peopleYouMention']()}
						value="mention"
					/>
					<div className={styles.divider} />
					<button className={styles.nestedRow} onClick={onOpenLists} type="button">
						<ListIcon className={styles.icon} />
						<RowLabel title={m['components.dialogs.reply.lists']()} />
						{lists.length > 0 && (
							<Text className={styles.pill} size="sm" weight="semiBold">
								{formatCount(lists.length)}
							</Text>
						)}
						<ChevronRightIcon className={styles.chevron} />
					</button>
				</CheckboxGroup>
			)}
		</div>
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
		<div className={styles.staticRow}>
			<LockIcon className={styles.icon} />
			<RowLabel subtitle={m['components.dialogs.reply.authorControlled']()} title={summary} />
		</div>
	);
}

function SectionHeader({ children }: { children: ReactNode }) {
	return (
		<Text className={styles.sectionHeader} color="textContrastMedium" size="sm" weight="semiBold">
			{children}
		</Text>
	);
}

function RowLabel({ subtitle, title }: { subtitle?: string; title: string }) {
	return (
		<span className={styles.text}>
			<Text size="md" weight="medium">
				{title}
			</Text>
			{subtitle != null && (
				<Text color="textContrastMedium" size="md_sub">
					{subtitle}
				</Text>
			)}
		</span>
	);
}

function RadioRow({
	className,
	label,
	subtitle,
	title,
	value,
}: {
	className?: string;
	label: string;
	subtitle: string;
	title: string;
	value: ThreadgateReplyMode;
}) {
	return (
		<Radio.Root aria-label={label} className={clsx(styles.row, className)} value={value}>
			<span className={styles.radio}>
				<Radio.Indicator className={styles.radioDot} />
			</span>
			<RowLabel subtitle={subtitle} title={title} />
		</Radio.Root>
	);
}

function CheckboxRow({ label, title, value }: { label: string; title: string; value: ReplyGroup }) {
	return (
		<Checkbox.Root aria-label={label} className={styles.nestedRow} value={value}>
			<span className={styles.checkbox}>
				<Checkbox.Indicator className={styles.checkboxIndicator}>
					<CheckIcon className={styles.checkIcon} />
				</Checkbox.Indicator>
			</span>
			<RowLabel title={title} />
		</Checkbox.Root>
	);
}
