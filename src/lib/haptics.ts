import { useCallback } from 'react';

export function useHaptics() {
	return useCallback((_strength: 'Heavy' | 'Light' | 'Medium' = 'Medium') => {
		return;
	}, []);
}
