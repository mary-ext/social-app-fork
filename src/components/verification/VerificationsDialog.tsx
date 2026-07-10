import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';

import { urls } from '#/lib/constants';

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
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const { isVerified } = useSimpleVerificationState({ profile });
	const isViewer = profile.did === currentAccount?.did;
	const label = isViewer
		? isVerified
			? m['components.verification.verified.youStatus']()
			: m['components.verification.verifications.yourTitle']()
		: isVerified
			? m['components.verification.verified.userStatus']({ name: profile.handle })
			: m['components.verification.verifications.userTitle']({ name: profile.handle });

	return (
		<Dialog.Stack gap="xl">
			<Dialog.Stack gap="lg">
				<Dialog.Stack gap="xs">
					<Dialog.TitleRow>
						<Dialog.Title>{label}</Dialog.Title>
						<Dialog.Close />
					</Dialog.TitleRow>

					<Text color="textContrastMedium">
						{isVerified
							? m['components.verification.verified.description']()
							: m['components.verification.verified.notVerified']()}
					</Text>
				</Dialog.Stack>

				{profile.verification ? (
					<Dialog.Stack gap="lg">
						<Dialog.Stack gap="md">
							<Text color="textContrastMedium" size="sm" weight="semiBold">
								{m['components.verification.verifications.verifiedBy']()}
							</Text>

							<Dialog.Stack gap="lg">
								{profile.verification.verifications.map((v) => (
									<VerifierCard key={v.uri} outerHandle={handle} verification={v} />
								))}
							</Dialog.Stack>
						</Dialog.Stack>

						{profile.verification.verifications.some((v) => !v.isValid) && isViewer && (
							<Admonition type="warning">
								{m['components.verification.verifications.someInvalid']()}
							</Admonition>
						)}
					</Dialog.Stack>
				) : null}
			</Dialog.Stack>

			<Dialog.Actions direction="responsive" reverse>
				<ExternalLinkButton
					color="secondary"
					label={m['components.verification.learnMore']()}
					size="small"
					href={urls.website.blog.initialVerificationAnnouncement}
				>
					<ButtonText>{m['common.action.learnMore']()}</ButtonText>
				</ExternalLinkButton>
				<Button
					color="primary"
					label={m['common.a11y.closeDialog']()}
					onClick={() => handle.close()}
					size="small"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Dialog.Stack>
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
									{m['components.verification.trustedVerifier.unknown']()}
								</Text>

								<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
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
								<ProfileCard.Handle profile={profile} />

								<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
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
