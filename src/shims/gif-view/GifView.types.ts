import { type ViewProps } from 'react-native';

export interface GifViewStateChangeEvent {
	nativeEvent: {
		isPlaying: boolean;
		isLoaded: boolean;
	};
}

export interface GifViewProps extends ViewProps {
	autoplay?: boolean;
	source?: string;
	sources?: ReadonlyArray<{ src: string; type: string }>;
	placeholderSource?: string;
	onPlayerStateChange?: (event: GifViewStateChangeEvent) => void;
}
