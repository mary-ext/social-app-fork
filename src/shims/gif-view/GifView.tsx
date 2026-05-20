import { createRef, PureComponent, type RefObject } from 'react';
import { type CSSProperties } from 'react';
import { StyleSheet } from 'react-native';

import { type GifViewProps } from '#/shims/gif-view/GifView.types';

export class GifView extends PureComponent<GifViewProps> {
	private readonly videoPlayerRef: RefObject<HTMLVideoElement | null> = createRef();
	private isLoaded = false;

	componentDidMount() {
		document.addEventListener('visibilitychange', this.onVisibilityChange);
	}

	componentDidUpdate(prevProps: Readonly<GifViewProps>) {
		if (prevProps.autoplay !== this.props.autoplay) {
			if (this.props.autoplay) {
				void this.playAsync();
			} else {
				void this.pauseAsync();
			}
		}
	}

	componentWillUnmount() {
		document.removeEventListener('visibilitychange', this.onVisibilityChange);
	}

	static async prefetchAsync(_sources: string[]): Promise<void> {}

	private onVisibilityChange = () => {
		if (
			document.visibilityState === 'visible' &&
			this.props.autoplay &&
			this.videoPlayerRef.current?.paused
		) {
			void this.playAsync();
		}
	};

	private firePlayerStateChangeEvent = () => {
		this.props.onPlayerStateChange?.({
			nativeEvent: {
				isPlaying: !this.videoPlayerRef.current?.paused,
				isLoaded: this.isLoaded,
			},
		});
	};

	private onLoad = () => {
		if (this.isLoaded) return;
		this.isLoaded = true;
		this.firePlayerStateChangeEvent();
	};

	async playAsync(): Promise<void> {
		await this.videoPlayerRef.current?.play();
	}

	async pauseAsync(): Promise<void> {
		this.videoPlayerRef.current?.pause();
	}

	async toggleAsync(): Promise<void> {
		if (this.videoPlayerRef.current?.paused) {
			await this.playAsync();
		} else {
			await this.pauseAsync();
		}
	}

	render() {
		const { sources, source, autoplay, accessibilityLabel, style } = this.props;
		const useSources = sources && sources.length > 0;

		return (
			<video
				src={useSources ? undefined : source}
				autoPlay={autoplay ? true : undefined}
				preload={autoplay ? 'auto' : undefined}
				playsInline={true}
				loop={true}
				muted={true}
				style={StyleSheet.flatten(style) as CSSProperties}
				onCanPlay={this.onLoad}
				onPlay={this.firePlayerStateChangeEvent}
				onPause={this.firePlayerStateChangeEvent}
				aria-label={accessibilityLabel}
				ref={this.videoPlayerRef}
			>
				{useSources ? sources.map((item) => <source key={item.src} src={item.src} type={item.type} />) : null}
			</video>
		);
	}
}
