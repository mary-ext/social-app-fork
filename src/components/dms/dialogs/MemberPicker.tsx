import { type ReactNode, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
import { clsx } from 'clsx';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import { canBeAddedToGroup, canBeMessaged } from '#/components/dms/util';
import * as SearchField from '#/components/forms/SearchField';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import ArrowLeftIcon from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type EmptyRow = { kind: 'empty'; key: string; message: string };
export type LabelRow = { kind: 'label'; key: string; message: string };
export type PlaceholderRow = { kind: 'placeholder'; key: string };
export type ProfileRow = { kind: 'profile'; key: string; profile: AnyProfileView };

type MemberListRow = EmptyRow | LabelRow | PlaceholderRow | ProfileRow;

const isProfileRow = (row: MemberListRow): row is ProfileRow => row.kind === 'profile';

const byGroupDeclaration = (a: AnyProfileView, b: AnyProfileView): number =>
	Number(canBeAddedToGroup(b)) - Number(canBeAddedToGroup(a));

/** sorts profiles that accept messages first, preserving their order. */
export const byMessageDeclaration = (a: AnyProfileView, b: AnyProfileView): number =>
	Number(canBeMessaged(b)) - Number(canBeMessaged(a));

export const searchRows = (
	results: AnyProfileView[] | undefined,
	currentAccountDid: string | undefined,
	isFetching: boolean,
	comparator: (a: AnyProfileView, b: AnyProfileView) => number,
	excludeDids?: ReadonlySet<string>,
): (EmptyRow | ProfileRow)[] => {
	const profiles = (results ?? [])
		.filter((profile) => profile.did !== currentAccountDid && !excludeDids?.has(profile.did))
		// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `filter` just returned
		.sort(comparator)
		.map((profile): ProfileRow => ({ kind: 'profile', key: profile.did, profile }));
	if (!isFetching && profiles.length === 0) {
		return [{ kind: 'empty', key: 'empty', message: m['common.search.empty']() }];
	}
	return profiles;
};

export function SelectMembersStep({
	excludeDids,
	memberLimit,
	members,
	onBack,
	onClose,
	onMembersChange,
	onRemoveMember,
	primaryButton,
	title,
}: {
	excludeDids?: ReadonlySet<string>;
	memberLimit: number | undefined;
	members: AnyProfileView[];
	onBack?: () => void;
	onClose: () => void;
	onMembersChange: (next: AnyProfileView[]) => void;
	onRemoveMember: (did: string) => void;
	primaryButton: ReactNode;
	title: string;
}) {
	const moderationOpts = useModerationOpts();
	const currentAccountDid = useSession().currentAccount?.did;
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccountDid);

	let rows: MemberListRow[];
	if (isError) {
		rows = [{ kind: 'empty', key: 'error', message: m['components.dialogs.error.network']() }];
	} else if (searchText.length) {
		rows = searchRows(results, currentAccountDid, isFetching, byGroupDeclaration, excludeDids);
	} else {
		const suggested: LabelRow = {
			kind: 'label',
			key: 'suggested',
			message: m['components.dms.search.suggested'](),
		};
		if (!follows) {
			rows = [suggested, { kind: 'placeholder', key: 'placeholder' }];
		} else {
			const profiles = mapDefined(
				follows.pages.flatMap((page) => page.follows),
				(profile): ProfileRow | undefined => {
					if (canBeAddedToGroup(profile) && !excludeDids?.has(profile.did)) {
						return { kind: 'profile', key: profile.did, profile };
					}
				},
			);
			rows = profiles.length > 0 ? [suggested, ...profiles] : [];
		}
	}
	const items = rows.filter(isProfileRow).map((row) => row.profile);

	const memberDids = new Set(members.map((profile) => profile.did));
	const atLimit = memberLimit != null && members.length >= memberLimit;
	const hasChips = members.length > 0 && moderationOpts != null;

	return (
		<Combobox.Root
			filter={null}
			inline
			inputValue={searchText}
			isItemEqualToValue={(a: AnyProfileView, b: AnyProfileView) => a.did === b.did}
			items={items}
			itemToStringLabel={(profile: AnyProfileView) => profile.handle}
			multiple
			onInputValueChange={(value, details) => {
				if (details.reason !== 'input-change') {
					return;
				}
				setSearchText(value);
			}}
			onValueChange={onMembersChange}
			open
			value={members}
		>
			<StepHeader onClose={onClose} title={title} />

			<SearchSlot onClear={() => setSearchText('')} overlap={!hasChips} searchText={searchText}>
				<Combobox.Input
					render={
						<SearchField.Input
							aria-label={m['common.search.action.profiles']()}
							autoFocus
							maxLength={50}
							placeholder={m['components.dms.search.placeholder']()}
						/>
					}
				/>
			</SearchSlot>

			{members.length > 0 && moderationOpts && (
				<MemberChips members={members} moderationOpts={moderationOpts} onRemove={onRemoveMember} />
			)}

			<Dialog.Body className={clsx(css.list, !hasChips && css.listOverlap)} tabIndex={-1}>
				<Combobox.List>
					{rows.map((row) => (
						<MemberRow
							atLimit={atLimit}
							key={row.key}
							memberDids={memberDids}
							moderationOpts={moderationOpts}
							row={row}
						/>
					))}
				</Combobox.List>
			</Dialog.Body>

			<StepFooter onBack={onBack}>{primaryButton}</StepFooter>
		</Combobox.Root>
	);
}

function MemberRow({
	atLimit,
	memberDids,
	moderationOpts,
	row,
}: {
	atLimit: boolean;
	memberDids: ReadonlySet<string>;
	moderationOpts: ModerationOptions | undefined;
	row: MemberListRow;
}) {
	switch (row.kind) {
		case 'empty':
			return <Empty message={row.message} />;
		case 'label':
			return <SectionLabel message={row.message} />;
		case 'placeholder':
			return <ProfileCard.LoadingPlaceholder count={10} />;
		case 'profile': {
			if (!moderationOpts) {
				return null;
			}
			const { profile } = row;
			const enabled = canBeAddedToGroup(profile);
			return (
				<Combobox.Item
					className={css.row}
					disabled={(atLimit && !memberDids.has(profile.did)) || !enabled}
					value={profile}
				>
					<ProfileRowContent
						disabledMessage={m['components.dms.recipient.error.cannotAdd']({ handle: `@${profile.handle}` })}
						enabled={enabled}
						moderationOpts={moderationOpts}
						profile={profile}
						trailing={
							enabled ? (
								<div className={css.indicator}>
									<Combobox.ItemIndicator>
										<CheckIcon fill="currentColor" size="sm" />
									</Combobox.ItemIndicator>
								</div>
							) : undefined
						}
					/>
				</Combobox.Item>
			);
		}
	}
}

function MemberChips({
	members,
	moderationOpts,
	onRemove,
}: {
	members: AnyProfileView[];
	moderationOpts: ModerationOptions;
	onRemove: (did: string) => void;
}) {
	return (
		<div className={css.chips}>
			{members.map((profile) => {
				const handle = profile.handle;

				return (
					<div className={css.chip} key={profile.did}>
						<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} size={24} />
						<Text className={css.chipName} numberOfLines={1} size="sm">
							{handle}
						</Text>
						<Button
							className={css.chipRemove}
							color="secondary"
							label={m['components.dms.group.action.removeMember']({ name: handle })}
							onClick={() => onRemove(profile.did)}
							shape="round"
							size="tiny"
							variant="ghost"
						>
							<ButtonIcon icon={XIcon} size="xs" />
						</Button>
					</div>
				);
			})}
		</div>
	);
}

/**
 * renders the shell for a single-select picker. put all rows in `children` and only navigable rows in
 * `items`.
 *
 * @param items rows navigable by keyboard
 * @param itemToStringValue converts an item to its accessible label
 * @param searchText controlled search text
 */
export function PickStepShell<Item>({
	children,
	items,
	itemToStringValue,
	onClose,
	onSearchTextChange,
	placeholder,
	searchText,
	title,
}: {
	children: ReactNode;
	items: Item[];
	itemToStringValue: (item: Item) => string;
	onClose: () => void;
	onSearchTextChange: (value: string) => void;
	placeholder: string;
	searchText: string;
	title: string;
}) {
	return (
		<Autocomplete.Root
			filter={null}
			inline
			items={items}
			itemToStringValue={itemToStringValue}
			onValueChange={(value, details) => {
				// do not replace the query with the selected label while the dialog closes.
				if (details.reason === 'item-press') {
					return;
				}
				onSearchTextChange(value);
			}}
			open
			value={searchText}
		>
			<StepHeader onClose={onClose} title={title} />

			<SearchSlot onClear={() => onSearchTextChange('')} overlap searchText={searchText}>
				<Autocomplete.Input
					render={
						<SearchField.Input
							aria-label={m['common.search.action.profiles']()}
							autoFocus
							maxLength={50}
							placeholder={placeholder}
						/>
					}
				/>
			</SearchSlot>

			{/* the input handles list navigation, so keep the scroller out of the tab order. */}
			<Dialog.Body className={clsx(css.list, css.listOverlap)} tabIndex={-1}>
				<Autocomplete.List>{children}</Autocomplete.List>
			</Dialog.Body>
		</Autocomplete.Root>
	);
}

/** renders a direct-chat profile row. */
export function ProfilePickerRow({
	moderationOpts,
	onSelect,
	row,
}: {
	moderationOpts: ModerationOptions | undefined;
	onSelect: (did: Did) => void;
	row: ProfileRow;
}) {
	if (!moderationOpts) {
		return null;
	}

	const { profile } = row;
	const enabled = canBeMessaged(profile);

	return (
		<Autocomplete.Item
			aria-label={m['common.chat.action.start']({ handle: profile.handle })}
			className={css.row}
			disabled={!enabled}
			onClick={() => onSelect(profile.did)}
			value={row}
		>
			<ProfileRowContent
				disabledMessage={m['components.dialogs.chat.cannotMessage']()}
				enabled={enabled}
				moderationOpts={moderationOpts}
				profile={profile}
			/>
		</Autocomplete.Item>
	);
}

export function StepHeader({ onClose, title }: { onClose: () => void; title: string }) {
	return (
		<div className={css.header}>
			<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
				{title}
			</Text>

			<Button
				className={css.closeButton}
				color="secondary"
				label={m['common.action.close']()}
				onClick={onClose}
				shape="round"
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={XIcon} />
			</Button>
		</div>
	);
}

export function SearchSlot({
	children,
	onClear,
	overlap,
	searchText,
}: {
	children: ReactNode;
	onClear: () => void;
	overlap: boolean;
	searchText: string;
}) {
	return (
		<div className={clsx(css.search, overlap && css.searchOverlap)}>
			<SearchField.Root>
				<SearchField.Icon />
				{children}
				{searchText.length > 0 && (
					<SearchField.Clear label={m['common.search.action.clear']()} onClick={onClear} />
				)}
			</SearchField.Root>
		</div>
	);
}

export function StepFooter({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
	return (
		<Dialog.Footer>
			<div className={css.footerRow}>
				<div>
					{onBack ? (
						<Button color="secondary" label={m['common.action.back']()} onClick={onBack} size="small">
							<ButtonIcon icon={ArrowLeftIcon} />
							<ButtonText>{m['common.action.back']()}</ButtonText>
						</Button>
					) : null}
				</div>

				<div>{children}</div>
			</div>
		</Dialog.Footer>
	);
}

export function ProfileRowContent({
	disabledMessage,
	enabled,
	moderationOpts,
	profile,
	trailing,
}: {
	disabledMessage?: string;
	enabled: boolean;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	trailing?: ReactNode;
}) {
	return (
		<ProfileCard.Header className={!enabled ? css.disabledHeader : undefined}>
			<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />

			{enabled ? (
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
			) : (
				<div className={css.column}>
					<ProfileCard.Handle profile={profile} />

					<Text color="textContrastHigh" numberOfLines={2} size="md_sub">
						{disabledMessage}
					</Text>
				</div>
			)}

			{trailing}
		</ProfileCard.Header>
	);
}

export function SectionLabel({ message }: { message: string }) {
	return (
		<div className={css.label}>
			<Text color="textContrastHigh" size="md_sub" weight="semiBold">
				{message}
			</Text>
		</div>
	);
}

export function Empty({ message }: { message: string }) {
	return (
		<div className={css.empty}>
			<Text className={css.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
	);
}
