import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import type { FullVerificationState } from '#/components/verification';
import { VerificationRemovePrompt } from '#/components/verification/VerificationRemovePrompt';
import * as css from '#/components/verification/VerificationsDialog.css';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { LinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as Prompt from '#/components/web/Prompt';
import { Text } from '#/components/web/Text';

export function VerificationsDialog({
	handle,
	profile,
	verificationState,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	verificationState: FullVerificationState;
}) {
	const { t: l } = useLingui();

	const userName = getUserDisplayName(profile);
	const state = verificationState;
	const label = state.profile.isViewer
		? state.profile.isVerified
			? l`You are verified`
			: l`Your verifications`
		: state.profile.isVerified
			? l`${userName} is verified`
			: l({
					comment: `Possessive, meaning "the verifications of {userName}"`,
					message: `${userName}'s verifications`,
				});

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={label} size="narrow">
				<div className={css.header}>
					<Text className={css.title} leading="tight" size="_2xl" weight="semiBold">
						{label}
					</Text>
					<Text leading="snug" size="md">
						{state.profile.isVerified ? (
							<Trans>This account has a checkmark because it's been verified by trusted sources.</Trans>
						) : (
							<Trans>
								This account has one or more attempted verifications, but it is not currently verified.
							</Trans>
						)}
					</Text>
				</div>
				{profile.verification ? (
					<div className={css.section}>
						<Text color="textContrastMedium" size="sm">
							<Trans>Verified by:</Trans>
						</Text>

						<div className={css.list}>
							{profile.verification.verifications.map((v) => (
								<VerifierCard key={v.uri} outerHandle={handle} subject={profile} verification={v} />
							))}
						</div>

						{profile.verification.verifications.some((v) => !v.isValid) && state.profile.isViewer && (
							<Admonition className={css.admonitionSpacing} type="warning">
								<Trans>Some of your verifications are invalid.</Trans>
							</Admonition>
						)}
					</div>
				) : null}
				<div className={css.actions}>
					<Button color="primary" label={l`Close dialog`} onClick={() => handle.close()} size="small">
						<ButtonText>
							<Trans>Close</Trans>
						</ButtonText>
					</Button>
					<LinkButton
						color="secondary"
						label={l({
							context: `english-only-resource`,
							message: `Learn more about verification on Bluesky`,
						})}
						size="small"
						to={urls.website.blog.initialVerificationAnnouncement}
					>
						<ButtonText>
							<Trans context="english-only-resource">Learn more</Trans>
						</ButtonText>
					</LinkButton>
				</div>
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function VerifierCard({
	outerHandle,
	subject,
	verification,
}: {
	outerHandle: Dialog.DialogHandle;
	subject: AnyProfileView;
	verification: AppBskyActorDefs.VerificationView;
}) {
	const { i18n, t: l } = useLingui();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const { data: profile, error } = useProfileQuery({ did: verification.issuer });
	const verificationRemovePromptControl = Prompt.usePromptHandle();
	const canAdminister = verification.issuer === currentAccount?.did;

	return (
		<div style={{ opacity: verification.isValid ? 1 : 0.5 }}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					{error ? (
						<>
							<ProfileCard.AvatarPlaceholder />
							<div className={css.nameColumn}>
								<Text leading="snug" numberOfLines={1} size="md" weight="semiBold">
									<Trans>Unknown verifier</Trans>
								</Text>
								<Text color="textContrastMedium" leading="snug" numberOfLines={1}>
									{verification.issuer}
								</Text>
							</div>
						</>
					) : profile && moderationOpts ? (
						<>
							<ProfileCard.Link
								className={css.cardRow}
								onPress={() => {
									outerHandle.close();
								}}
								profile={profile}
							>
								<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
								<div className={css.nameColumn}>
									<ProfileCard.Name moderationOpts={moderationOpts} profile={profile} />
									<Text color="textContrastMedium" leading="snug" numberOfLines={1}>
										{i18n.date(new Date(verification.createdAt), {
											dateStyle: 'long',
										})}
									</Text>
								</div>
							</ProfileCard.Link>
							{canAdminister && (
								<Button
									color="negative"
									label={l`Remove verification`}
									onClick={() => {
										verificationRemovePromptControl.open(null);
									}}
									shape="round"
									size="small"
									variant="ghost"
								>
									<ButtonIcon icon={TrashIcon} />
								</Button>
							)}
						</>
					) : (
						<>
							<ProfileCard.AvatarPlaceholder />
							<ProfileCard.NameAndHandlePlaceholder />
						</>
					)}
				</ProfileCard.Header>
			</ProfileCard.Outer>
			<VerificationRemovePrompt
				handle={verificationRemovePromptControl}
				onConfirm={() => outerHandle.close()}
				profile={subject}
				verifications={[verification]}
			/>
		</div>
	);
}
