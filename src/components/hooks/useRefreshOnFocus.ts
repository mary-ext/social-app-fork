import { useRef } from 'react';

import { useFocusEffect } from '#/router';

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
	const firstTimeRef = useRef(true);

	useFocusEffect(() => {
		if (firstTimeRef.current) {
			firstTimeRef.current = false;
			return;
		}

		void refetch();
	});
}
