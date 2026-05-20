import { useState } from 'react';

export function GrowthHack({ children }: { children: React.ReactNode; align?: 'left' | 'right' }) {
	// the button has a variable width and is absolutely positioned, so we need to manually
	// set the minimum width of the underlying button
	const [] = useState<number | undefined>(undefined);

	return children;
}
