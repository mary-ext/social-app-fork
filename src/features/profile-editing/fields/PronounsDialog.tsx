import { type KeyboardEvent, useState } from 'react';

import { getGraphemeLength } from '@atcute/util-text';

import { MAX_PRONOUNS } from '#/lib/constants/profile';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { parsePronouns, togglePronoun } from '../lib/pronoun-suggestions';
import * as styles from './fields.css';

// the counter only appears as someone nears the limit.
const SHOW_COUNTER_FROM = 12;

/**
 * adds, edits, or removes pronouns in the edit-profile draft; the profile is written when that form saves.
 *
 * @param props dialog handle, current pronouns, and a callback receiving the trimmed pronouns or ''
 */
export function PronounsDialog({
	handle,
	pronouns,
	onChange,
}: {
	handle: Dialog.DialogHandle;
	pronouns: string;
	onChange: (pronouns: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<PronounsForm
					initial={pronouns}
					onDone={(next) => {
						handle.close();
						onChange(next);
					}}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function PronounsForm({ initial, onDone }: { initial: string; onDone: (pronouns: string) => void }) {
	const [pronouns, setPronouns] = useState(initial);

	const isEditing = !!initial;
	const length = getGraphemeLength(pronouns);
	const tooLong = length > MAX_PRONOUNS;
	const suggestions = [
		m['screens.profile.editProfile.pronouns.suggestion.she'](),
		m['screens.profile.editProfile.pronouns.suggestion.he'](),
		m['screens.profile.editProfile.pronouns.suggestion.they'](),
		m['screens.profile.editProfile.pronouns.suggestion.it'](),
	];
	const picked = parsePronouns(pronouns, suggestions) ?? [];

	const save = () => {
		if (tooLong) {
			return;
		}
		onDone(pronouns.trim());
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			save();
		}
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>
						{isEditing
							? m['screens.profile.editProfile.pronouns.edit']()
							: m['screens.profile.editProfile.pronouns.add']()}
					</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastHigh" leading="snug" size="md">
					{m['screens.profile.editProfile.pronouns.hint']()}
				</Text>
			</Stack>

			<Stack gap="md">
				<div
					aria-label={m['screens.profile.editProfile.pronouns.label']()}
					className={styles.suggestions}
					role="group"
				>
					{suggestions.map((value, index) => {
						const selected = picked.includes(index);
						return (
							<Button
								aria-pressed={selected}
								color={selected ? 'secondary_inverted' : 'secondary'}
								key={value}
								label={value}
								onClick={() => setPronouns(togglePronoun(pronouns, index, suggestions))}
								size="small"
							>
								{selected && <ButtonIcon icon={CheckIcon} />}
								<ButtonText>{value}</ButtonText>
							</Button>
						);
					})}
				</div>

				<TextField.Root isInvalid={tooLong}>
					<TextField.LabelText
						accessory={
							length >= SHOW_COUNTER_FROM ? (
								<Text
									aria-label={m['screens.profile.editProfile.pronouns.countLabel']({
										length,
										max: MAX_PRONOUNS,
									})}
									color={tooLong ? 'negative_400' : 'textContrastLow'}
									size="sm"
								>
									{length}/{MAX_PRONOUNS}
								</Text>
							) : undefined
						}
					>
						{m['screens.profile.editProfile.pronouns.label']()}
					</TextField.LabelText>
					<TextField.Input
						autoCapitalize="none"
						autoFocus
						label={m['screens.profile.editProfile.pronouns.label']()}
						onChangeText={setPronouns}
						onKeyDown={onKeyDown}
						placeholder={m['screens.profile.editProfile.pronouns.placeholder']()}
						value={pronouns}
					/>
					{tooLong && (
						<Text className={styles.errorText} color="negative_400" size="sm" weight="semiBold">
							{m['screens.profile.editProfile.pronouns.tooLong']({ max: MAX_PRONOUNS })}
						</Text>
					)}
				</TextField.Root>
			</Stack>

			<Dialog.Actions align="between">
				{isEditing ? (
					<Button
						color="negative_subtle"
						label={m['screens.profile.editProfile.pronouns.remove']()}
						onClick={() => onDone('')}
						size="small"
					>
						<ButtonText>{m['screens.profile.editProfile.pronouns.remove']()}</ButtonText>
					</Button>
				) : (
					<div></div>
				)}

				<Button
					disabled={tooLong}
					label={m['screens.profile.editProfile.pronouns.done']()}
					onClick={save}
					size="small"
				>
					<ButtonText>{m['screens.profile.editProfile.pronouns.done']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
