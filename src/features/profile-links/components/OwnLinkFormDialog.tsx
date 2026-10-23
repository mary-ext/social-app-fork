import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import { Stack } from '#/components/Stack';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { useSaveProfileLinksMutation } from '../queries';
import type { ProfileLink, SavedProfileLink } from '../types';
import { LinkForm } from './LinkForm';
import { linkLabel } from './LinkPill';

export type OwnLinkFormPayload = { uri: ResourceUri };

/**
 * edits or removes a profile link, saving immediately.
 *
 * @param props dialog handle, owner profile, and displayed links
 */
export function OwnLinkFormDialog({
	handle,
	links,
	profile,
}: {
	handle: Dialog.DialogHandle<OwnLinkFormPayload>;
	links: SavedProfileLink[];
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: OwnLinkFormPayload | undefined }) => {
				const index = payload ? links.findIndex((link) => link.uri === payload.uri) : -1;
				if (index === -1) {
					return null;
				}
				return (
					<Dialog.Popup size="narrow">
						<DialogInner handle={handle} index={index} profile={profile} stored={links} />
					</Dialog.Popup>
				);
			}}
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	index,
	profile,
	stored,
}: {
	handle: Dialog.DialogHandle<OwnLinkFormPayload>;
	index: number;
	profile: AppBskyActorDefs.ProfileViewDetailed;
	stored: SavedProfileLink[];
}) {
	const removePromptHandle = Prompt.usePromptHandle();
	const { mutate: save } = useSaveProfileLinksMutation();

	const commit = (next: ProfileLink[]) => {
		handle.close();
		save(
			{ existing: stored, links: next, profile },
			{
				onError: (e) => {
					console.error('failed to save profile links', e);
					Toast.show(m['features.profileLinks.saveError'](), { type: 'error' });
				},
			},
		);
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['features.profileLinks.form.editTitle']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
			</Stack>

			<LinkForm index={index} links={stored} onDone={commit} onRemove={() => removePromptHandle.open()} />

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.action.remove']()}
				description={m['features.profileLinks.removePrompt.description']()}
				handle={removePromptHandle}
				onConfirm={() => commit(stored.filter((_, i) => i !== index))}
				title={m['features.profileLinks.removePrompt.title']({ name: linkLabel(stored[index]!) })}
			/>
		</Stack>
	);
}
