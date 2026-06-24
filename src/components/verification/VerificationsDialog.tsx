import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Text } from '#/components/Text';
import { useSimpleVerificationState } from '#/components/verification';
import * as css from '#/components/verification/VerificationsDialog.css';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

export function VerificationsDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const { isVerified } = useSimpleVerificationState({ profile });
	const isViewer = profile.did === currentAccount?.did;
	const userName = getUserDisplayName(profile);
	const label = isViewer
		? isVerified
			? l`You are verified`
			: l`Your verifications`
		: isVerified
			? l`${userName} is verified`
			: l({
					comment: `Possessive, meaning "the verifications of {userName}"`,
					message: `${userName}'s verifications`,
				});

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={label} size="narrow">
				<div className={css.header}>
					<Text className={css.title} size="_2xl" weight="semiBold">
						{label}
					</Text>
					<Text size="md">
						{isVerified ? (
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
								<VerifierCard key={v.uri} outerHandle={handle} verification={v} />
							))}
						</div>

						{profile.verification.verifications.some((v) => !v.isValid) && isViewer && (
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
					<ExternalLinkButton
						color="secondary"
						label={l({
							context: `english-only-resource`,
							message: `Learn more about verification on Bluesky`,
						})}
						size="small"
						href={urls.website.blog.initialVerificationAnnouncement}
					>
						<ButtonText>
							<Trans context="english-only-resource">Learn more</Trans>
						</ButtonText>
					</ExternalLinkButton>
				</div>
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function VerifierCard({
	outerHandle,
	verification,
}: {
	outerHandle: Dialog.DialogHandle;
	verification: AppBskyActorDefs.VerificationView;
}) {
	const { i18n } = useLingui();
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
									<Trans>Unknown verifier</Trans>
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
									{i18n.date(new Date(verification.createdAt), {
										dateStyle: 'long',
									})}
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
