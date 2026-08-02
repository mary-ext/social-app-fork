import type { Props } from '#/components/icons/common';

import VerifiedCheck from '#/icons/original/VerifiedCheck.svg';
import VerifierCheck from '#/icons/original/VerifierCheck.svg';

export function VerificationCheck({
	verifier,
	...rest
}: Props & {
	verifier?: boolean;
}) {
	return verifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />;
}
