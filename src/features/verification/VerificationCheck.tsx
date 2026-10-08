'use no memo'; // forwarded SVG props invalidate the generated wrapper cache

import type { SVGProps } from 'react';

import VerifiedCheck from '#/icons/original/VerifiedCheck.svg';
import VerifierCheck from '#/icons/original/VerifierCheck.svg';

/**
 * The verification badge. The glyph draws its disc from `currentColor`, so callers set the state colour with
 * a class rather than a fill.
 */
export function VerificationCheck({
	verifier,
	...rest
}: SVGProps<SVGSVGElement> & {
	verifier?: boolean;
}) {
	return verifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />;
}
