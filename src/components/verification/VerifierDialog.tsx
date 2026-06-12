import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';

import { useSession } from '#/state/session';

import { VerifierCheck } from '#/components/icons/VerifierCheck';
import type { FullVerificationState } from '#/components/verification';
import * as css from '#/components/verification/VerifierDialog.css';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { LinkButton } from '#/components/web/Link';
import { Text } from '#/components/web/Text';

import announcementImage from '../../../assets/images/initial_verification_announcement_1.png';

export function VerifierDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	verificationState: FullVerificationState;
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const userName = getUserDisplayName(profile);
	const label = isSelf ? l`You are a trusted verifier` : l`${userName} is a trusted verifier`;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={label} size="narrow">
				<div className={css.content}>
					<div className={css.imageBox}>
						<img
							alt={l`An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts.`}
							className={css.image}
							src={announcementImage}
						/>
					</div>

					<div className={css.textBlock}>
						<Text className={css.title} leading="tight" size="_2xl" weight="semiBold">
							{label}
						</Text>
						<Text leading="snug" size="md">
							<Trans>
								Accounts with a scalloped blue check mark{' '}
								<span className={css.inlineCheck}>
									<VerifierCheck width={14} />
								</span>{' '}
								can verify others. These trusted verifiers are selected by Bluesky.
							</Trans>
						</Text>
					</div>

					<div className={css.actions}>
						<LinkButton
							color="primary"
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
						<Button color="secondary" label={l`Close dialog`} onClick={() => handle.close()} size="small">
							<ButtonText>
								<Trans>Close</Trans>
							</ButtonText>
						</Button>
					</div>
				</div>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
