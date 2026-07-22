import { memo, type ReactNode } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import { cleanError } from '#/lib/strings/errors';

import { useListMembershipRemoveMutation } from '#/state/queries/list-memberships';

import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as profileCardCss from '#/components/web/ProfileCard.css';

import { m } from '#/paraglide/messages';

import * as css from './ListMember.css';

export const ListMember = memo(function ListMember({
	index,
	isOwner,
	list,
	membershipUri,
	moderationOpts,
	profile,
}: {
	index: number;
	isOwner?: boolean;
	list: ResourceUri;
	membershipUri: ResourceUri;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}): ReactNode {
	const removePromptHandle = Prompt.usePromptHandle();

	const { isPending, mutate: removeFromList } = useListMembershipRemoveMutation({
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
		onSuccess: () => Toast.show(m['components.dialogs.list.removedToast']()),
	});

	const onConfirmRemove = () => {
		removeFromList({ actorDid: profile.did, listUri: list, membershipUri });
	};

	return (
		<>
			<ProfileCard.Link className={profileCardCss.defaultRow({ topBorder: index !== 0 })} profile={profile}>
				<ProfileCard.Outer>
					<ProfileCard.Header>
						<ProfileCard.Avatar moderationOpts={moderationOpts} profile={profile} />
						<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />

						{isOwner && (
							<Menu.Root>
								<Menu.Trigger
									render={
										<Button
											className={css.moreButton}
											color="secondary"
											disabled={isPending}
											label={m['common.a11y.moreOptions']()}
											shape="round"
											size="small"
											variant="ghost"
										>
											<ButtonIcon icon={DotsHorizontal} />
										</Button>
									}
								/>
								<Menu.Popup align="end" label={m['common.a11y.moreOptions']()}>
									<Menu.Item
										destructive
										label={m['screens.profileList.members.remove']()}
										onClick={() => removePromptHandle.open(null)}
									>
										<Menu.ItemIcon icon={TrashIcon} />
										<Menu.ItemText>{m['screens.profileList.members.remove']()}</Menu.ItemText>
									</Menu.Item>
								</Menu.Popup>
							</Menu.Root>
						)}
					</ProfileCard.Header>

					<ProfileCard.Labels moderationOpts={moderationOpts} profile={profile} />

					<ProfileCard.Description profile={profile} />
				</ProfileCard.Outer>
			</ProfileCard.Link>

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.action.remove']()}
				description={m['screens.profileList.members.removeConfirm.message']({ handle: profile.handle })}
				handle={removePromptHandle}
				onConfirm={onConfirmRemove}
				title={m['screens.profileList.members.removeConfirm.title']()}
			/>
		</>
	);
});
