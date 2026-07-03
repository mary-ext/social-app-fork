import { useLayoutEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/lib/custom-animations/CountWheel.css';
import { decideShouldRoll } from '#/lib/custom-animations/util';
import { useReducedMotion } from '#/lib/reduced-motion';

export function CountWheel({
	count,
	isToggled,
	hasBeenToggled,
	renderCount,
}: {
	count: number;
	isToggled: boolean;
	hasBeenToggled: boolean;
	renderCount: (props: { count: number }) => React.ReactNode;
}) {
	const reducedMotion = useReducedMotion();
	const shouldAnimate = hasBeenToggled && !reducedMotion;

	const prevIsToggled = useRef(isToggled);
	// the outgoing number + its direction during a roll; null at rest. `key` retriggers the CSS animation.
	const [roll, setRoll] = useState<{ from: number; key: number; up: boolean } | null>(null);
	const rollKey = useRef(0);

	// layout effect, not a passive one: the roll must be set up before the browser paints, otherwise
	// the new count flashes at rest for a frame before jumping off-screen to start its enter animation.
	useLayoutEffect(() => {
		if (isToggled === prevIsToggled.current) {
			return;
		}
		prevIsToggled.current = isToggled;
		if (shouldAnimate && decideShouldRoll(isToggled, count)) {
			rollKey.current += 1;
			setRoll({ from: isToggled ? count - 1 : count + 1, key: rollKey.current, up: isToggled });
		}
	}, [isToggled, count, shouldAnimate]);

	if (count < 1) {
		return null;
	}

	return (
		<div className={styles.root}>
			<div
				key={roll?.key}
				className={clsx(styles.current, roll && (roll.up ? styles.enterUp : styles.enterDown))}
				onAnimationEnd={() => setRoll(null)}
			>
				{renderCount({ count })}
			</div>
			{roll ? (
				<div aria-hidden className={roll.up ? styles.exitUp : styles.exitDown}>
					{renderCount({ count: roll.from })}
				</div>
			) : null}
		</div>
	);
}
