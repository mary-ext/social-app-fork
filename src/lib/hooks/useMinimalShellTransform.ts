import { interpolate, useAnimatedStyle } from '#/lib/animations/reanimatedCompat';

import { useMinimalShellMode } from '#/state/shell/minimal-mode';

export function useMinimalShellFabTransform() {
	const { footerMode } = useMinimalShellMode();

	const fabTransform = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: interpolate(footerMode.get(), [0, 1], [-44, 0]),
				},
			],
		};
	});
	return fabTransform;
}
