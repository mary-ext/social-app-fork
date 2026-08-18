import { useRouter } from '#/router';

/** returns a handler that navigates back, or to Home when there is nothing to go back to. */
export function useGoBack(onGoBack?: () => unknown) {
	const router = useRouter();
	return () => {
		onGoBack?.();
		if (router.canGoBack) {
			router.back();
		} else {
			router.navigate({ to: { name: 'Home' } });
		}
	};
}
