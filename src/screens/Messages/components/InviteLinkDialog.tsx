import { useState } from 'react';
import { View } from 'react-native';
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

import { dateTimeLong } from '#/locale/intl/datetime';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText, StackedButton } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails, GroupConvoMember } from '#/components/dms/util';
import * as Toggle from '#/components/forms/Toggle';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import { ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon } from '#/components/icons/ChainLink';
import { EditBig_Stroke2_Corner2_Rounded as EditIcon } from '#/components/icons/EditBig';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { CopyTextButton } from './CopyTextButton';
import { EditTextButton } from './EditTextButton';

enum Step {
	INFO,
	GENERATE,
	MANAGE,
	CONFIRM_DISABLE,
}

export function InviteLinkDialog({
	convo,
	control,
	owner,
	isOwner,
	moderationOpts,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	control: Dialog.DialogOuterProps['control'];
	owner: GroupConvoMember;
	isOwner: boolean;
	moderationOpts: ModerationOptions;
}) {
	const t = useTheme();
	const ownerName = createSanitizedDisplayName(
		owner,
		false,
		getDisplayRestrictions(moderateProfile(owner, moderationOpts), DisplayContext.ProfileBio),
	);

	const { joinLink } = convo.details;

	const defaultStep = joinLink ? Step.MANAGE : Step.INFO;
	const defaultWhoCanJoin = joinLink ? joinLinkToKey(joinLink) : 'anyone';

	const [step, setStep] = useState(defaultStep);
	const [whoCanJoin, setWhoCanJoin] = useState(defaultWhoCanJoin);

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
			member: m['screens.messages.joinSettings.ownerFollowsInstant']({ ownerName }),
		},
		{
			name: 'followedByOwner:requireApproval',
			owner: m['screens.messages.joinSettings.followingRequest'](),
			member: m['screens.messages.joinSettings.ownerFollowsRequest']({ ownerName }),
		},
	];

	let content: React.ReactNode = null;
	let header: string | null = null;
	switch (step) {
		case Step.INFO: {
			header = m['screens.messages.inviteLink.label']();
			content = (
				<>
					<View style={[a.gap_lg]}>
						<Text style={[a.text_md, a.leading_snug]}>{m['screens.messages.inviteLink.info']()}</Text>
						<Text style={[a.text_md, a.leading_snug]}>
							{m['screens.messages.members.add.limit']({ count: convo.details.memberLimit })}
						</Text>
						<Text style={[a.text_md, a.leading_snug]}>{m['screens.messages.inviteLink.privacy']()}</Text>
					</View>
					<View style={[a.mt_4xl]}>
						<Button
							label={m['screens.messages.conversation.getStarted']()}
							color="primary"
							size="large"
							onPress={() => {
								setStep(Step.GENERATE);
							}}
						>
							<ButtonText>{m['screens.messages.conversation.getStarted']()}</ButtonText>
							<ButtonIcon icon={ArrowRightIcon} />
						</Button>
					</View>
				</>
			);
			break;
		}
		case Step.GENERATE: {
			const linkEnabled = joinLink?.enabledStatus === 'enabled';
			const linkHasChanged = linkEnabled && joinLinkRuleKey !== whoCanJoin;

			header = linkEnabled
				? m['screens.messages.inviteLink.edit.update']()
				: m['screens.messages.inviteLink.generate.action']();
			content = (
				<>
					<Text style={[a.text_md]}>{m['screens.messages.joinSettings.hint']()}</Text>
					<View style={[a.mt_lg]}>
						<Toggle.Group
							label={m['screens.messages.joinSettings.label']()}
							type="radio"
							values={[whoCanJoin]}
							onChange={([value]) => setWhoCanJoin(value!)}
						>
							<View style={[a.gap_xs]}>
								{whoCanJoinOptions.map((option) => (
									<Toggle.Item
										key={option.name}
										highlightRow
										label={isOwner ? option.owner : option.member}
										name={option.name}
										style={[a.flex_1]}
									>
										{({ selected }) => (
											<Toggle.RadioWithLabel
												label={isOwner ? option.owner : option.member}
												selected={selected}
											/>
										)}
									</Toggle.Item>
								))}
							</View>
						</Toggle.Group>
					</View>
					<View style={[a.mt_4xl]}>
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
							onPress={() => {
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
						>
							<ButtonText>
								{linkEnabled
									? linkHasChanged
										? m['screens.messages.inviteLink.edit.update']()
										: m['common.action.back']()
									: m['screens.messages.inviteLink.generate.action']()}
							</ButtonText>
							{linkHasChanged && <ButtonIcon icon={isSaving ? Loader : ArrowRightIcon} />}
						</Button>
					</View>
				</>
			);
			break;
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
			header = linkEnabled ? m['screens.messages.inviteLink.label']() : m['common.chat.inviteLinkDisabled']();
			content = (
				<>
					<View style={[a.mt_lg]}>
						<CopyTextButton
							disabled={linkDisabled || !joinLink?.code}
							label={m['screens.messages.inviteLink.label']()}
							value={joinLinkURI}
						>
							<Text
								numberOfLines={1}
								style={[a.mr_xs, a.text_md, linkDisabled ? t.atoms.text_contrast_low : t.atoms.text]}
							>
								{joinLinkURI}
							</Text>
						</CopyTextButton>
						{createdAt ? (
							<Text style={[a.mt_xs, a.text_xs, t.atoms.text_contrast_medium]}>
								{m['screens.messages.inviteLink.created']({
									date: dateTimeLong.format(createdAt),
								})}
							</Text>
						) : null}
					</View>
					{linkEnabled ? (
						isOwner ? (
							<View style={[a.mt_lg]}>
								<EditTextButton
									label={m['screens.messages.inviteLink.edit.settings']()}
									value={ownerValue}
									onPress={() => setStep(Step.GENERATE)}
								>
									<View style={[a.flex_1]}>
										<Text style={[a.text_sm]}>{ownerValue}</Text>
									</View>
								</EditTextButton>
							</View>
						) : (
							<Text style={[a.mt_sm, a.mb_sm, a.text_sm]}>{memberValue}</Text>
						)
					) : null}
					{linkEnabled ? (
						<View style={[a.flex_row, a.justify_between, a.gap_sm, a.mt_lg]}>
							{isOwner ? (
								<StackedButton
									label={m['screens.messages.inviteLink.disable.confirm']()}
									icon={ChainLinkBrokenIcon}
									color="negative_subtle"
									style={[a.flex_1, a.rounded_full]}
									onPress={() => setStep(Step.CONFIRM_DISABLE)}
								>
									{m['screens.messages.inviteLink.disable.confirm']()}
								</StackedButton>
							) : null}
							<StackedButton
								disabled={linkDisabled}
								label={m['screens.messages.composer.embed.postLink']()}
								icon={EditIcon}
								color="primary_subtle"
								style={[a.flex_1, a.rounded_full]}
								onPress={() => {
									control.close(() => {
										openComposer({
											text: joinLinkURI,
											logContext: 'Other',
										});
									});
								}}
							>
								{m['screens.messages.composer.embed.postLink']()}
							</StackedButton>
							<StackedButton
								disabled={linkDisabled}
								label={m['common.share.action.share']()}
								icon={ArrowShareRightIcon}
								color="primary_subtle"
								style={[a.flex_1, a.rounded_full]}
								onPress={() => {
									void shareUrl(joinLinkURI);
								}}
							>
								{m['common.share.action.share']()}
							</StackedButton>
						</View>
					) : (
						<View style={[a.gap_md, a.mt_lg]}>
							<Button
								disabled={isEnabling || isDisabling}
								label={m['screens.messages.inviteLink.enable.action']()}
								color="primary"
								size="large"
								onPress={() => {
									enableJoinLink();
								}}
							>
								<ButtonText>{m['screens.messages.inviteLink.enable.short']()}</ButtonText>
								{isEnabling && <ButtonIcon icon={Loader} />}
							</Button>
							<Button
								disabled={isEnabling || isDisabling}
								label={m['screens.messages.inviteLink.generate.new']()}
								color="secondary"
								size="large"
								onPress={() => setStep(Step.GENERATE)}
							>
								<ButtonText>{m['screens.messages.inviteLink.generate.newShort']()}</ButtonText>
							</Button>
						</View>
					)}
				</>
			);
			break;
		}
		case Step.CONFIRM_DISABLE: {
			content = (
				<>
					<View style={[a.align_center, a.justify_center, a.mb_lg]}>
						<ChainLinkBrokenIcon fill={colors.negative_500} size="3xl" />
					</View>
					<Text style={[a.flex_1, a.pb_sm, a.text_center, a.text_lg, a.font_bold, a.leading_snug]}>
						{m['screens.messages.inviteLink.disable.title']()}
					</Text>
					<Text style={[a.pb_2xl, a.text_center, a.text_sm, a.leading_snug]}>
						{m['screens.messages.inviteLink.disable.message']()}
					</Text>
					<View style={[a.w_full, a.gap_md, a.justify_end]}>
						<Button
							color="negative"
							disabled={isDisabling}
							size="large"
							label={m['screens.messages.inviteLink.disable.action']()}
							onPress={() => {
								disableJoinLink();
								setStep(Step.MANAGE);
							}}
						>
							<ButtonText>{m['screens.messages.inviteLink.disable.action']()}</ButtonText>
						</Button>
						<Button
							color="secondary"
							size="large"
							label={m['common.action.cancel']()}
							onPress={() => {
								setStep(Step.MANAGE);
							}}
						>
							<ButtonText>{m['common.action.cancel']()}</ButtonText>
						</Button>
					</View>
				</>
			);
			break;
		}
	}

	if (!isOwner && (!joinLink || joinLink.enabledStatus === 'disabled')) {
		header = m['screens.messages.inviteLink.label']();
		content = (
			<>
				<View style={[a.mt_lg]}>
					<Text style={[a.text_sm]}>{m['screens.messages.inviteLink.empty']()}</Text>
				</View>
				<View style={[a.gap_md, a.mt_lg]}>
					<Button
						label={m['common.action.close']()}
						color="primary"
						size="large"
						onPress={() => control.close()}
					>
						<ButtonText>{m['common.action.close']()}</ButtonText>
					</Button>
				</View>
			</>
		);
	}

	return (
		<Dialog.Outer
			control={control}
			onClose={() => {
				setStep(defaultStep);
				setWhoCanJoin(defaultWhoCanJoin);
			}}
		>
			<Dialog.Handle />
			<Dialog.ScrollableInner
				header={
					<View>
						<View style={[a.px_2xl, a.pt_xl]}>
							<Text style={[a.font_bold, a.text_2xl, a.mb_sm]}>{header}</Text>
						</View>
						<Dialog.Close />
					</View>
				}
				label={m['screens.messages.inviteLink.a11y']()}
				style={{ maxWidth: 400 }}
			>
				{content}
			</Dialog.ScrollableInner>
		</Dialog.Outer>
	);
}

function joinLinkToKey(joinLink: ChatBskyGroupDefs.JoinLinkView): string {
	return `${joinLink.joinRule}${joinLink.requireApproval ? ':requireApproval' : ''}`;
}

function keyToJoinLink(key: string): Pick<ChatBskyGroupDefs.JoinLinkView, 'joinRule' | 'requireApproval'> {
	const [joinRule, requireApproval] = key.split(':');
	return {
		// the key is built from our own `whoCanJoinOptions` names, so its rule segment is always valid
		joinRule: joinRule as ChatBskyGroupDefs.JoinRule,
		requireApproval: requireApproval === 'requireApproval',
	};
}
