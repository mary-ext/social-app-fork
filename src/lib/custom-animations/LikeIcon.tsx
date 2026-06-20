import { useEffect, useRef } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import * as styles from '#/lib/custom-animations/LikeIcon.css';
import { useReducedMotion } from '#/lib/reduced-motion';

import {
	Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
	Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2';

const animationConfig: KeyframeAnimationOptions = {
	duration: 600,
	easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	fill: 'forwards',
};
const scaleKeyframes: Keyframe[] = [
	{ transform: 'scale(1)' },
	{ transform: 'scale(0.7)' },
	{ transform: 'scale(1.2)' },
	{ transform: 'scale(1)' },
];
const circle1Keyframes: Keyframe[] = [
	{ opacity: 0, transform: 'scale(0)' },
	{ opacity: 0.4 },
	{ transform: 'scale(1.5)' },
	{ opacity: 0.4 },
	{ opacity: 0, transform: 'scale(1.5)' },
];
const circle2Keyframes: Keyframe[] = [
	{ opacity: 0, transform: 'scale(0)' },
	{ opacity: 1 },
	{ transform: 'scale(0)' },
	{ opacity: 1 },
	{ opacity: 0, transform: 'scale(1.5)' },
];

export function AnimatedLikeIcon({
	isLiked,
	big,
	hasBeenToggled,
}: {
	isLiked: boolean;
	big?: boolean;
	hasBeenToggled: boolean;
}) {
	const size = big ? 22 : 18;
	const reducedMotion = useReducedMotion();
	const shouldAnimate = hasBeenToggled && !reducedMotion;
	const prevIsLiked = useRef(isLiked);

	const heartRef = useRef<SVGSVGElement>(null);
	const circle1Ref = useRef<HTMLDivElement>(null);
	const circle2Ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (prevIsLiked.current === isLiked) {
			return;
		}
		prevIsLiked.current = isLiked;
		if (shouldAnimate && isLiked) {
			heartRef.current?.animate(scaleKeyframes, animationConfig);
			circle1Ref.current?.animate(circle1Keyframes, animationConfig);
			circle2Ref.current?.animate(circle2Keyframes, animationConfig);
		}
	}, [shouldAnimate, isLiked]);

	return (
		<div className={styles.root} style={assignInlineVars({ [styles.sizeVar]: `${size}px` })}>
			{isLiked ? (
				<HeartIconFilled ref={heartRef} fill="currentColor" width={size} />
			) : (
				<HeartIconOutline fill="currentColor" width={size} />
			)}
			<div ref={circle1Ref} className={styles.circle1} />
			<div ref={circle2Ref} className={styles.circle2} />
		</div>
	);
}
