import type { KeyboardEvent } from 'react';

import { reorder } from '@oomfware/tug/reorder';

import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/TextField';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { MAX_PROFILE_LINKS, type ProfileLink } from '../types';
import { LinkFormDialog, type LinkFormPayload } from './LinkFormDialog';
import { linkLabel, ProfileLinkButton } from './LinkPill';
import * as css from './ProfileLinksEditor.css';
import { type SortableItem, SortablePills } from './SortablePills';

/**
 * edits and reorders links locally until the profile is saved.
 *
 * @param props links and change callback
 */
export function ProfileLinksEditor({
	links,
	onChange,
}: {
	links: ProfileLink[];
	onChange: (links: ProfileLink[]) => void;
}) {
	const formHandle = Dialog.useDialogHandle<LinkFormPayload>();

	const moveBy = (index: number, offset: number) => {
		const to = index + offset;
		if (to < 0 || to >= links.length) {
			return;
		}
		onChange(reorder(links, index, to));
	};

	// Alt+Arrow provides keyboard reordering.
	const onPillKeyDown = (index: number, e: KeyboardEvent<HTMLButtonElement>) => {
		if (!e.altKey) {
			return;
		}
		switch (e.key) {
			case 'ArrowLeft':
			case 'ArrowUp': {
				e.preventDefault();
				moveBy(index, -1);
				break;
			}
			case 'ArrowRight':
			case 'ArrowDown': {
				e.preventDefault();
				moveBy(index, 1);
				break;
			}
		}
	};

	const items: SortableItem[] = links.map((link, index) => {
		const label = linkLabel(link);
		return {
			key: link.url,
			label,
			node: (
				<ProfileLinkButton
					label={m['features.profileLinks.editor.edit']({ name: label })}
					link={link}
					onClick={() => formHandle.openWithPayload({ index })}
					onKeyDown={(e) => onPillKeyDown(index, e)}
				/>
			),
		};
	});

	return (
		<div className={css.section}>
			<TextField.LabelText>{m['features.profileLinks.editor.label']()}</TextField.LabelText>
			<SortablePills
				items={items}
				onReorder={(from, to) => onChange(reorder(links, from, to))}
				trailing={
					links.length < MAX_PROFILE_LINKS ? (
						<Button
							className={css.addPill}
							color="secondary"
							label={m['features.profileLinks.editor.addA11y']()}
							onClick={() => formHandle.openWithPayload({ index: null })}
							size="small"
							variant="outline"
						>
							<ButtonIcon icon={PlusIcon} />
							<ButtonText>{m['features.profileLinks.editor.add']()}</ButtonText>
						</Button>
					) : null
				}
			/>
			<LinkFormDialog handle={formHandle} links={links} onChange={onChange} />
		</div>
	);
}
