import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { dateLong } from '#/locale/intl/datetime';

import { Text } from '#/components/Text';
import { useSimpleVerificationState } from '#/components/verification';
import * as css from '#/components/verification/VerificationsDialog.css';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

export function VerificationsDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	const userName = getUserDisplayName(profile);
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.verification.title.verificationsFor']({ userName })} size="narrow">
				<DialogInner handle={handle} profile={profile} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const { isVerified } = useSimpleVerificationState({ profile });
	const isViewer = profile.did === currentAccount?.did;
	const userName = getUserDisplayName(profile);
	const label = isViewer
		? isVerified
			? m['components.verification.status.youVerified']()
			: m['components.verification.title.yourVerifications']()
		: isVerified
			? m['components.verification.status.userVerified']({ userName })
			: m['components.verification.title.userVerifications']({ userName });

	return (
		<>
			<div className={css.header}>
				<Text className={css.title} size="_2xl" weight="semiBold">
					{label}
				</Text>
				<Text size="md">
					{isVerified
						? m['components.verification.description.verified']()
						: m['components.verification.description.notVerified']()}
				</Text>
			</div>
			{profile.verification ? (
				<div className={css.section}>
					<Text color="textContrastMedium" size="sm">
						{m['components.verification.label.verifiedBy']()}
					</Text>

					<div className={css.list}>
						{profile.verification.verifications.map((v) => (
							<VerifierCard key={v.uri} outerHandle={handle} verification={v} />
						))}
					</div>

					{profile.verification.verifications.some((v) => !v.isValid) && isViewer && (
						<Admonition className={css.admonitionSpacing} type="warning">
							{m['components.verification.error.someInvalid']()}
						</Admonition>
					)}
				</div>
			) : null}
			<div className={css.actions}>
				<Button
					color="primary"
					label={m['common.a11y.closeDialog']()}
					onClick={() => handle.close()}
					size="small"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
				<ExternalLinkButton
					color="secondary"
					label={m['components.verification.cta.learnMore']()}
					size="small"
					href={urls.website.blog.initialVerificationAnnouncement}
				>
					<ButtonText>{m['common.action.learnMore']()}</ButtonText>
				</ExternalLinkButton>
			</div>
		</>
	);
}

function VerifierCard({
	outerHandle,
	verification,
}: {
	outerHandle: Dialog.DialogHandle;
	verification: AppBskyActorDefs.VerificationView;
}) {
	const moderationOpts = useModerationOpts();
	const { data: profile, error } = useProfileQuery({ did: verification.issuer });

	return (
		<div style={{ opacity: verification.isValid ? 1 : 0.5 }}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					{error ? (
						<>
							<ProfileCard.AvatarPlaceholder />
							<div className={css.nameColumn}>
								<Text numberOfLines={1} size="md" weight="semiBold">
									{m['components.verification.label.unknownVerifier']()}
								</Text>
								<Text color="textContrastMedium" numberOfLines={1}>
									{verification.issuer}
								</Text>
							</div>
						</>
					) : profile && moderationOpts ? (
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
								<Text color="textContrastMedium" numberOfLines={1}>
									{dateLong.format(new Date(verification.createdAt))}
								</Text>
							</div>
						</ProfileCard.Link>
					) : (
						<>
							<ProfileCard.AvatarPlaceholder />
							<ProfileCard.NameAndHandlePlaceholder />
						</>
					)}
				</ProfileCard.Header>
			</ProfileCard.Outer>
		</div>
	);
}
