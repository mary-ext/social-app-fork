import { createContext, useContext, useState } from 'react';

const Context = createContext<{
	volume: number;
	setVolume: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);
Context.displayName = 'VideoVolumeContext';

export function Provider({ children }: { children: React.ReactNode }) {
	const [volume, setVolume] = useState(1);

	const value = {
		volume,
		setVolume,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVideoVolumeState() {
	const context = useContext(Context);
	if (!context) {
		throw new Error('useVideoVolumeState must be used within a VideoVolumeProvider');
	}
	return [context.volume, context.setVolume] as const;
}
