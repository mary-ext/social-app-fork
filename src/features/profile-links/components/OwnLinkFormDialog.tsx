import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import * as Dialog from '#/components/Dialog';
import { ErrorState } from '#/components/ErrorState';
import * as Prompt from '#/components/Prompt';
import { Stack } from '#/components/Stack';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { useOwnProfileLinksQuery, useSaveProfileLinksMutation } from '../queries';
import type { ProfileLink } from '../types';
import { LinkForm } from './LinkForm';
import { linkLabel } from './LinkPill';

export type OwnLinkFormPayload = { uri: ResourceUri };

/**
 * edits or removes a profile link, saving immediately.
 *
 * @param props the dialog's handle and the owner's profile
 */
export function OwnLinkFormDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle<OwnLinkFormPayload>;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: OwnLinkFormPayload | undefined }) => {
				if (!payload) {
					return null;
				}
				return (
					<Dialog.Popup size="narrow">
						<DialogInner handle={handle} profile={profile} uri={payload.uri} />
					</Dialog.Popup>
				);
			}}
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	profile,
	uri,
}: {
	handle: Dialog.DialogHandle<OwnLinkFormPayload>;
	profile: AppBskyActorDefs.ProfileViewDetailed;
	uri: ResourceUri;
}) {
	const removePromptHandle = Prompt.usePromptHandle();
	const { data: stored, isError, refetch } = useOwnProfileLinksQuery(profile.did);
	const { mutate: save } = useSaveProfileLinksMutation();

	if (isError) {
		return <ErrorState message={m['features.profileLinks.loadError']()} onRetry={() => void refetch()} />;
	}
	if (!stored) {
		return <Dialog.Loading />;
	}

	// AppView may still show a link already removed from the repo.
	const index = stored.findIndex((link) => link.uri === uri);
	if (index === -1) {
		return <ErrorState message={m['features.profileLinks.loadError']()} onRetry={() => void refetch()} />;
	}

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
