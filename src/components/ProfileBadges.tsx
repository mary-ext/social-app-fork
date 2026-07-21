import type { AnyProfileView } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { useProfileShadow } from '#/state/cache/profile-shadow';

import { useAlf } from '#/alf';

import { BotBadge, BotBadgeButton, isBotAccount } from '#/components/BotBadge';
import * as css from '#/components/ProfileBadges.css';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { VerificationCheckButton } from '#/components/verification/VerificationCheckButton';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const verificationIconSizes: Record<Size, number> = {
	lg: 18,
	md: 14,
	sm: 12,
	xl: 22,
	xs: 10,
} as const;

const botIconSizes: Record<Size, number> = {
	lg: 19,
	md: 15,
	sm: 13,
	xl: 23,
	xs: 11,
} as const;

export function ProfileBadges({
	className,
	interactive = false,
	profile,
	size,
}: {
	className?: string;
	interactive?: boolean;
	profile: AnyProfileView;
	size: Size;
}) {
	const shadowed = useProfileShadow(profile);
	const verification = useSimpleVerificationState({ profile });
	const {
		fonts: { scaleMultiplier },
	} = useAlf();

	// if nothing to show, don't render the container at all
	if (!verification.showBadge && !isBotAccount(shadowed)) {
		return null;
	}

	const isOnTheSmallSide = size === 'sm' || size === 'xs';

	const verificationIconWidth = verificationIconSizes[size] * scaleMultiplier;
	const botIconWidth = botIconSizes[size] * scaleMultiplier;

	return (
		<div className={clsx(css.container({ small: isOnTheSmallSide }), className)}>
			{interactive ? (
				<>
					<VerificationCheckButton profile={shadowed} width={verificationIconWidth} />
					<BotBadgeButton profile={shadowed} width={botIconWidth} />
				</>
			) : (
				<>
					{verification.showBadge && (
						<VerificationCheck verifier={verification.role === 'verifier'} width={verificationIconWidth} />
					)}
					<BotBadge profile={shadowed} width={botIconWidth} />
				</>
			)}
		</div>
	);
}
