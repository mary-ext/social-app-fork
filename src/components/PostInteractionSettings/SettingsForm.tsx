import { useState } from 'react';

import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { RadioGroup } from '@base-ui/react/radio-group';

import {
	type InteractionSettings,
	NO_REPLY_GROUPS,
	type ReplyAudience,
	restrictReplies,
} from '#/lib/interaction-settings';

import { formatCount } from '#/locale/intl/number';

import * as Settings from '#/components/Settings';
import { Text } from '#/components/Text';
import { getReplyAudienceSummary } from '#/components/WhoCanReply';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import QuoteIcon from '#/icons/central/CloseQuote2_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './SettingsForm.css';

const REPLY_GROUPS: ('followers' | 'following' | 'mentioned')[] = ['followers', 'following', 'mentioned'];

export type PostInteractionSettingsFormProps = {
	value: InteractionSettings;
	onChange: (next: InteractionSettings) => void;
	onOpenLists: () => void;
	replySettingsDisabled?: boolean;
	saveAsDefault?: SaveAsDefaultOption;
};

type SaveAsDefaultOption = {
	checked: boolean;
	/** false disables and unchecks the option. */
	differsFromDefaults: boolean;
	onChange: (checked: boolean) => void;
};

/**
 * reply and quote settings. includes row padding; render without horizontal container padding.
 *
 * @param props.value current settings
 * @param props.onChange receives the updated settings
 * @param props.onOpenLists opens the picker for lists whose members can reply
 * @param props.replySettingsDisabled shows reply settings as a read-only summary
 * @param props.saveAsDefault save-as-default checkbox state and handler; omitted hides the option
 * @returns the settings list
 */
export function PostInteractionSettingsForm({
	value,
	onChange,
	onOpenLists,
	replySettingsDisabled,
	saveAsDefault,
}: PostInteractionSettingsFormProps) {
	return (
		<Settings.List surface="flush">
			<Settings.Section titleText={m['common.interaction.whoCanReply']()}>
				{replySettingsDisabled ? (
					<LockedReplyRow replies={value.replies} />
				) : (
					<ReplyRows
						onChange={(replies) => onChange({ ...value, replies })}
						onOpenLists={onOpenLists}
						replies={value.replies}
					/>
				)}
			</Settings.Section>

			<Settings.Section titleText={m['components.dialogs.interaction.quote.title']()}>
				<Settings.SwitchRow
					label={
						value.allowQuotes
							? m['components.dialogs.interaction.quote.disable']()
							: m['components.dialogs.interaction.quote.enable']()
					}
					onChange={(allowQuotes) => onChange({ ...value, allowQuotes })}
					value={value.allowQuotes}
				>
					<Settings.Icon icon={QuoteIcon} />
					<Settings.Label
						subtitleText={m['components.dialogs.interaction.quote.description']()}
						titleText={m['components.dialogs.interaction.quote.allow']()}
					/>
				</Settings.SwitchRow>
			</Settings.Section>

			{saveAsDefault && (
				<Settings.Section>
					<Settings.CheckboxRow
						checked={saveAsDefault.differsFromDefaults && saveAsDefault.checked}
						disabled={!saveAsDefault.differsFromDefaults}
						label={m['components.dialogs.mutedWord.saveOptions']()}
						onChange={saveAsDefault.onChange}
					>
						<Settings.Label
							subtitleText={
								saveAsDefault.differsFromDefaults
									? undefined
									: m['components.dialogs.mutedWord.defaultSettings']()
							}
							titleText={m['components.dialogs.mutedWord.saveOptions']()}
						/>
					</Settings.CheckboxRow>
				</Settings.Section>
			)}
		</Settings.List>
	);
}

function ReplyRows({
	onChange,
	onOpenLists,
	replies,
}: {
	onChange: (next: ReplyAudience) => void;
	onOpenLists: () => void;
	replies: ReplyAudience;
}) {
	// arrow keys select radios as they move, so passing through anyone/nobody must not discard the groups
	const [lastSome, setLastSome] = useState<ReplyAudience>(replies);
	if (replies.type === 'some' && lastSome !== replies) {
		setLastSome(replies);
	}

	const onChangeMode = (next: ReplyAudience['type']) => {
		switch (next) {
			case 'anyone':
			case 'nobody': {
				onChange({ type: next });
				break;
			}
			case 'some': {
				onChange(
					lastSome.type === 'some' ? lastSome : restrictReplies({ ...NO_REPLY_GROUPS, mentioned: true }),
				);
				break;
			}
		}
	};

	// keep checkboxes outside the radio group's roving focus. CSS places them between "some" and "nobody".
	return (
		<>
			<RadioGroup<ReplyAudience['type']>
				aria-label={m['components.dialogs.reply.description']()}
				className={styles.radioGroup}
				onValueChange={onChangeMode}
				value={replies.type}
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
			{replies.type === 'some' && (
				<CheckboxGroup
					aria-label={m['components.dialogs.reply.advancedDescription']()}
					className={styles.nest}
					onValueChange={(values: string[]) => {
						const groups = new Set(values);
						onChange(
							restrictReplies({
								followers: groups.has('followers'),
								following: groups.has('following'),
								lists: replies.lists,
								mentioned: groups.has('mentioned'),
							}),
						);
					}}
					render={<Settings.Group />}
					value={REPLY_GROUPS.filter((group) => replies[group])}
				>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowFollowers']()} value="followers">
						<Settings.Label titleText={m['components.dialogs.reply.followers']()} />
					</Settings.CheckboxRow>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowFollows']()} value="following">
						<Settings.Label titleText={m['components.dialogs.reply.peopleYouFollow']()} />
					</Settings.CheckboxRow>
					<Settings.CheckboxRow label={m['components.dialogs.reply.allowMentions']()} value="mentioned">
						<Settings.Label titleText={m['components.dialogs.reply.peopleYouMention']()} />
					</Settings.CheckboxRow>
					<Settings.ButtonRow label={m['components.dialogs.reply.lists']()} onPress={onOpenLists}>
						<Settings.Icon icon={ListIcon} />
						<Settings.Label titleText={m['components.dialogs.reply.lists']()} />
						{replies.lists.length > 0 && (
							<Text className={styles.pill} size="sm" weight="semiBold">
								{formatCount(replies.lists.length)}
							</Text>
						)}
					</Settings.ButtonRow>
				</CheckboxGroup>
			)}
		</>
	);
}

function LockedReplyRow({ replies }: { replies: ReplyAudience }) {
	return (
		<Settings.StaticRow>
			<Settings.Icon icon={LockIcon} />
			<Settings.Label
				subtitleText={m['components.dialogs.reply.authorControlled']()}
				titleText={getReplyAudienceSummary(replies)}
			/>
		</Settings.StaticRow>
	);
}
