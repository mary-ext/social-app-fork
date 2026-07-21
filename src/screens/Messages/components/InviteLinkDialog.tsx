import { type ReactNode, useState } from 'react';

import type { ChatBskyGroupDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { shareUrl } from '#/lib/sharing';

import { useCreateJoinLink } from '#/state/queries/messages/create-join-link';
import { useDisableJoinLink } from '#/state/queries/messages/disable-join-link';
import { useEditJoinLink } from '#/state/queries/messages/edit-join-link';
import { useEnableJoinLink } from '#/state/queries/messages/enable-join-link';

import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails, GroupConvoMember } from '#/components/dms/util';
import * as Toggle from '#/components/forms/Toggle';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import { ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon } from '#/components/icons/ChainLink';
import { EditBig_Stroke2_Corner2_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Spinner } from '#/components/Spinner';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { CopyLinkField } from './CopyLinkField';
import { EditTextButton } from './EditTextButton';
import * as css from './InviteLinkDialog.css';

enum Step {
	INFO,
	GENERATE,
	MANAGE,
	CONFIRM_DISABLE,
}

type DialogInnerProps = {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	handle: Dialog.DialogHandle;
	isOwner: boolean;
	moderationOpts: ModerationOptions;
	owner: GroupConvoMember;
};

export function InviteLinkDialog(props: DialogInnerProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup size="narrow">
				<DialogInner {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ convo, handle, isOwner, moderationOpts, owner }: DialogInnerProps) {
	const ownerName = createSanitizedDisplayName(
		owner,
		false,
		getDisplayRestrictions(moderateProfile(owner, moderationOpts), DisplayContext.ProfileBio),
	);

	const { joinLink } = convo.details;

	const [step, setStep] = useState(joinLink ? Step.MANAGE : Step.INFO);
	const [whoCanJoin, setWhoCanJoin] = useState(joinLink ? joinLinkToKey(joinLink) : 'anyone');

	// Resync local state when the server-side join link rules change (mutation
	// success, refetch, or change from another client). Keyed on the rule string
	// so identity-only refetches don't bump a user mid-edit.
	const joinLinkRuleKey = joinLink ? joinLinkToKey(joinLink) : null;
	const [prevKey, setPrevKey] = useState(joinLinkRuleKey);
	if (joinLinkRuleKey !== prevKey) {
		setStep(joinLinkRuleKey ? Step.MANAGE : Step.INFO);
		setWhoCanJoin(joinLinkRuleKey ?? 'anyone');
		setPrevKey(joinLinkRuleKey);
	}

	const { openComposer } = useOpenComposer();

	const { mutate: createJoinLink, isPending: isCreating } = useCreateJoinLink(convo.view.id, {
		onSuccess: () => {
			setStep(Step.MANAGE);
		},
		onError: () => {
			Toast.show(m['screens.messages.inviteLink.generate.error'](), {
				type: 'error',
			});
		},
	});
	const { mutate: editJoinLink, isPending: isEditing } = useEditJoinLink(convo.view.id, {
		onSuccess: () => {
			setStep(Step.MANAGE);
		},
		onError: () => {
			Toast.show(m['screens.messages.inviteLink.edit.error'](), {
				type: 'error',
			});
		},
	});
	const { mutate: disableJoinLink, isPending: isDisabling } = useDisableJoinLink(convo.view.id, {
		onError: () => {
			Toast.show(m['screens.messages.inviteLink.disable.error'](), {
				type: 'error',
			});
		},
	});
	const { mutate: enableJoinLink, isPending: isEnabling } = useEnableJoinLink(convo.view.id, {
		onError: () => {
			Toast.show(m['screens.messages.inviteLink.enable.error'](), {
				type: 'error',
			});
		},
	});
	const isSaving = isCreating || isEditing;
	const onWhoCanJoinChange = ([value]: string[]) => {
		if (value) {
			setWhoCanJoin(value);
		}
	};

	const whoCanJoinOptions = [
		{
			name: 'anyone',
			owner: m['screens.messages.joinSettings.anyoneInstant'](),
			member: m['screens.messages.joinSettings.anyoneInstant'](),
		},
		{
			name: 'anyone:requireApproval',
			owner: m['screens.messages.joinSettings.anyoneRequest'](),
			member: m['screens.messages.joinSettings.anyoneRequest'](),
		},
		{
			name: 'followedByOwner',
			owner: m['screens.messages.joinSettings.followingInstant'](),
			member: m['screens.messages.joinSettings.ownerFollowsInstant']({ name: ownerName }),
		},
		{
			name: 'followedByOwner:requireApproval',
			owner: m['screens.messages.joinSettings.followingRequest'](),
			member: m['screens.messages.joinSettings.ownerFollowsRequest']({ name: ownerName }),
		},
	];

	if (!isOwner && (!joinLink || joinLink.enabledStatus === 'disabled')) {
		return (
			<StepLayout title={m['screens.messages.inviteLink.label']()}>
				<Text>{m['screens.messages.inviteLink.empty']()}</Text>

				<Button
					label={m['common.action.close']()}
					color="primary"
					size="large"
					onClick={() => handle.close()}
					variant="solid"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</StepLayout>
		);
	}

	switch (step) {
		case Step.INFO: {
			return (
				<StepLayout title={m['screens.messages.inviteLink.label']()}>
					<Stack gap="md">
						<Text leading="snug" size="md">
							{m['screens.messages.inviteLink.info']()}
						</Text>
						<Text leading="snug" size="md">
							{m['screens.messages.members.add.limit']({ count: convo.details.memberLimit })}
						</Text>
						<Text leading="snug" size="md">
							{m['screens.messages.inviteLink.privacy']()}
						</Text>
					</Stack>

					<Button
						label={m['screens.messages.conversation.getStarted']()}
						color="primary"
						size="large"
						onClick={() => {
							setStep(Step.GENERATE);
						}}
						variant="solid"
					>
						<ButtonText>{m['screens.messages.conversation.getStarted']()}</ButtonText>
						<ButtonIcon icon={ArrowRightIcon} />
					</Button>
				</StepLayout>
			);
		}
		case Step.GENERATE: {
			const linkEnabled = joinLink?.enabledStatus === 'enabled';
			const linkHasChanged = linkEnabled && joinLinkRuleKey !== whoCanJoin;

			return (
				<StepLayout
					title={
						linkEnabled
							? m['screens.messages.inviteLink.edit.update']()
							: m['screens.messages.inviteLink.generate.action']()
					}
					subtitle={m['screens.messages.joinSettings.hint']()}
				>
					<Toggle.Group
						label={m['screens.messages.joinSettings.label']()}
						type="radio"
						values={[whoCanJoin]}
						onChange={onWhoCanJoinChange}
						className={css.radioList}
					>
						{whoCanJoinOptions.map((option) => {
							const label = isOwner ? option.owner : option.member;
							return (
								<Toggle.RadioItem key={option.name} label={label} value={option.name}>
									<Toggle.Panel>
										<Toggle.RadioIndicator />
										<Toggle.PanelText>{label}</Toggle.PanelText>
									</Toggle.Panel>
								</Toggle.RadioItem>
							);
						})}
					</Toggle.Group>

					<Button
						label={
							linkEnabled
								? linkHasChanged
									? m['screens.messages.inviteLink.edit.update']()
									: m['common.action.back']()
								: m['screens.messages.inviteLink.generate.action']()
						}
						color={linkEnabled && !linkHasChanged ? 'secondary' : 'primary'}
						size="large"
						disabled={isSaving}
						onClick={() => {
							const { joinRule, requireApproval } = keyToJoinLink(whoCanJoin);
							if (linkEnabled) {
								if (!linkHasChanged) {
									setStep(Step.MANAGE);
									return;
								}
								editJoinLink({
									joinRule,
									requireApproval,
								});
							} else {
								createJoinLink({
									joinRule,
									requireApproval,
								});
							}
						}}
						variant="solid"
					>
						<ButtonText>
							{linkEnabled
								? linkHasChanged
									? m['screens.messages.inviteLink.edit.update']()
									: m['common.action.back']()
								: m['screens.messages.inviteLink.generate.action']()}
						</ButtonText>
						{linkHasChanged ? (
							isSaving ? (
								<Spinner color="white" label={m['common.status.saving']()} size="sm" />
							) : (
								<ButtonIcon icon={ArrowRightIcon} />
							)
						) : null}
					</Button>
				</StepLayout>
			);
		}
		case Step.MANAGE: {
			const linkEnabled = joinLink?.enabledStatus === 'enabled';
			const linkDisabled = joinLink?.enabledStatus === 'disabled';
			const joinLinkURI = joinLink?.code ? `https://bsky.app/chat/${joinLink.code}` : 'https://bsky.app/chat';
			const createdAt = joinLink ? new Date(joinLink.createdAt) : null;
			const currentOption =
				whoCanJoinOptions.find((o) => o.name === (joinLink ? joinLinkToKey(joinLink) : null)) ??
				whoCanJoinOptions[0]!;
			const ownerValue = currentOption?.owner ?? whoCanJoinOptions[0]!.owner;
			const memberValue = currentOption?.member ?? whoCanJoinOptions[0]!.member;

			return (
				<StepLayout
					title={
						linkEnabled ? m['screens.messages.inviteLink.label']() : m['common.chat.inviteLinkDisabled']()
					}
				>
					<Stack gap="sm">
						<CopyLinkField
							disabled={linkDisabled || !joinLink?.code}
							label={m['screens.messages.inviteLink.label']()}
							value={joinLinkURI}
						/>

						{createdAt ? (
							<Text color="textContrastMedium" size="sm">
								{m['screens.messages.inviteLink.created']({
									date: createdAt,
								})}
							</Text>
						) : null}
					</Stack>

					{linkEnabled ? (
						isOwner ? (
							<EditTextButton label={ownerValue} onClick={() => setStep(Step.GENERATE)}>
								<Text size="md_sub">{ownerValue}</Text>
							</EditTextButton>
						) : (
							<Text className={css.memberValue} size="sm">
								{memberValue}
							</Text>
						)
					) : null}

					{linkEnabled ? (
						<Dialog.Actions align="center">
							{isOwner ? (
								<Button
									label={m['screens.messages.inviteLink.disable.confirm']()}
									color="negative_subtle"
									onClick={() => setStep(Step.CONFIRM_DISABLE)}
								>
									<ButtonIcon icon={ChainLinkBrokenIcon} />
									<ButtonText>{m['screens.messages.inviteLink.disable.confirm']()}</ButtonText>
								</Button>
							) : null}
							<Button
								disabled={linkDisabled}
								label={m['screens.messages.composer.embed.postLink']()}
								color="primary_subtle"
								onClick={() => {
									handle.close();
									openComposer({
										text: joinLinkURI,
									});
								}}
							>
								<ButtonIcon icon={EditIcon} />
								<ButtonText>{m['screens.messages.composer.embed.postLink']()}</ButtonText>
							</Button>
							<Button
								disabled={linkDisabled}
								label={m['common.share.action.share']()}
								color="primary_subtle"
								onClick={() => {
									void shareUrl(joinLinkURI);
								}}
							>
								<ButtonIcon icon={ArrowShareRightIcon} />
								<ButtonText>{m['common.share.action.share']()}</ButtonText>
							</Button>
						</Dialog.Actions>
					) : (
						<Stack gap="md">
							<Button
								disabled={isEnabling || isDisabling}
								label={m['screens.messages.inviteLink.enable.action']()}
								color="primary"
								size="large"
								onClick={() => {
									enableJoinLink();
								}}
								variant="solid"
							>
								<ButtonText>{m['screens.messages.inviteLink.enable.short']()}</ButtonText>
								{isEnabling ? <Spinner color="white" label={m['common.status.saving']()} size="sm" /> : null}
							</Button>
							<Button
								disabled={isEnabling || isDisabling}
								label={m['screens.messages.inviteLink.generate.new']()}
								color="secondary"
								size="large"
								onClick={() => setStep(Step.GENERATE)}
								variant="solid"
							>
								<ButtonText>{m['screens.messages.inviteLink.generate.newShort']()}</ButtonText>
							</Button>
						</Stack>
					)}
				</StepLayout>
			);
		}
		case Step.CONFIRM_DISABLE: {
			return (
				<Stack gap="xl">
					<Dialog.Close variant="floating" />

					<div className={css.confirm}>
						<ChainLinkBrokenIcon fill={colors.negative_500} size="4xl" />

						<Dialog.Title className={css.confirmTitle}>
							{m['screens.messages.inviteLink.disable.title']()}
						</Dialog.Title>

						<Text align="center" className={css.confirmMessage} color="textContrastMedium">
							{m['screens.messages.inviteLink.disable.message']()}
						</Text>
					</div>

					<Stack gap="md">
						<Button
							color="negative"
							disabled={isDisabling}
							size="large"
							label={m['screens.messages.inviteLink.disable.action']()}
							onClick={() => {
								disableJoinLink();
								setStep(Step.MANAGE);
							}}
							variant="solid"
						>
							<ButtonText>{m['screens.messages.inviteLink.disable.action']()}</ButtonText>
						</Button>
						<Button
							color="secondary"
							size="large"
							label={m['common.action.cancel']()}
							onClick={() => {
								setStep(Step.MANAGE);
							}}
							variant="solid"
						>
							<ButtonText>{m['common.action.cancel']()}</ButtonText>
						</Button>
					</Stack>
				</Stack>
			);
		}
	}
}

function StepLayout({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
}) {
	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{title}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				{subtitle ? <Text color="textContrastMedium">{subtitle}</Text> : null}
			</Stack>

			{children}
		</Stack>
	);
}

function joinLinkToKey(joinLink: ChatBskyGroupDefs.JoinLinkView): string {
	return `${joinLink.joinRule}${joinLink.requireApproval ? ':requireApproval' : ''}`;
}

function keyToJoinLink(key: string): Pick<ChatBskyGroupDefs.JoinLinkView, 'joinRule' | 'requireApproval'> {
	const [joinRule, requireApproval] = key.split(':');
	return {
		// the key is built from our own `whoCanJoinOptions` names, so its rule segment is always one of these
		joinRule: joinRule === 'followedByOwner' ? 'followedByOwner' : 'anyone',
		requireApproval: requireApproval === 'requireApproval',
	};
}
