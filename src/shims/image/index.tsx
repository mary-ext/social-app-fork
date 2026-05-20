import { type ComponentRef, forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import {
	Image as RNImage,
	ImageBackground as RNImageBackground,
	type ImageBackgroundProps as RNImageBackgroundProps,
	type ImageProps as RNImageProps,
	type ImageStyle,
} from 'react-native';

export type { ImageStyle };
export type Image = ComponentRef<typeof RNImage> & {
	startAnimating: () => void;
	stopAnimating: () => void;
};

export type ImageErrorEventData = {
	error: string;
};

type Source = string | number | { uri?: string | null; width?: number; height?: number } | null | undefined;

type LoadEvent = {
	source: { width: number; height: number; uri?: string };
};

type ExtraImageProps = {
	source?: Source | Source[];
	contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	cachePolicy?: unknown;
	placeholder?: unknown;
	placeholderContentFit?: unknown;
	priority?: unknown;
	recyclingKey?: unknown;
	transition?: unknown;
	autoplay?: boolean;
	enableLiveTextInteraction?: boolean;
	loading?: 'eager' | 'lazy' | string;
	onDisplay?: () => void;
	onLoad?: (event: LoadEvent) => void;
	onError?: (event: ImageErrorEventData) => void;
};

export type ImageProps = Omit<RNImageProps, 'source' | 'onLoad' | 'onError'> & ExtraImageProps;

function normalizeSource(source: ExtraImageProps['source']): RNImageProps['source'] {
	const value = Array.isArray(source) ? source[0] : source;
	if (typeof value === 'string') return { uri: value };
	if (value == null) return undefined;
	return value as RNImageProps['source'];
}

function imageStyle(
	style: RNImageProps['style'],
	contentFit: ExtraImageProps['contentFit'],
): RNImageProps['style'] {
	if (!contentFit) return style;
	return [style, { objectFit: contentFit }] as RNImageProps['style'];
}

function resizeModeForContentFit(
	contentFit: ExtraImageProps['contentFit'],
): RNImageProps['resizeMode'] | undefined {
	switch (contentFit) {
		case 'cover':
		case 'contain':
			return contentFit;
		case 'fill':
			return 'stretch';
		case 'none':
			return 'center';
		case 'scale-down':
			return 'contain';
		default:
			return undefined;
	}
}

type ImageComponent = ForwardRefExoticComponent<ImageProps & RefAttributes<ComponentRef<typeof RNImage>>> & {
	prefetch: (url: string | string[], cachePolicy?: unknown) => Promise<boolean>;
	clearDiskCache: () => Promise<boolean>;
	clearMemoryCache: () => Promise<boolean>;
};

export const Image = forwardRef<ComponentRef<typeof RNImage>, ImageProps>(function Image(
	{
		cachePolicy,
		contentFit,
		onDisplay,
		placeholder,
		placeholderContentFit,
		priority,
		recyclingKey,
		source,
		style,
		transition,
		onLoad,
		onError,
		...props
	},
	ref,
) {
	void cachePolicy;
	void placeholder;
	void placeholderContentFit;
	void priority;
	void recyclingKey;
	void transition;

	return (
		<RNImage
			ref={ref}
			{...props}
			source={normalizeSource(source)}
			resizeMode={resizeModeForContentFit(contentFit) ?? props.resizeMode}
			style={imageStyle(style, contentFit)}
			onLoad={(event) => {
				const source = event.nativeEvent?.source ?? {};
				onLoad?.({
					source: {
						width: source.width ?? 0,
						height: source.height ?? 0,
						uri: source.uri,
					},
				});
				onDisplay?.();
			}}
			onError={(event) => onError?.({ error: event.nativeEvent.error })}
		/>
	);
}) as ImageComponent;

Image.prefetch = async (url) => {
	const urls = Array.isArray(url) ? url : [url];
	await Promise.all(urls.map((item) => RNImage.prefetch(item)));
	return true;
};
Image.clearDiskCache = async () => true;
Image.clearMemoryCache = async () => true;

type ImageBackgroundProps = Omit<RNImageBackgroundProps, 'source'> & ExtraImageProps;

export function ImageBackground({
	cachePolicy,
	contentFit,
	placeholder,
	placeholderContentFit,
	priority,
	recyclingKey,
	source,
	style,
	transition,
	...props
}: ImageBackgroundProps) {
	void cachePolicy;
	void placeholder;
	void placeholderContentFit;
	void priority;
	void recyclingKey;
	void transition;

	return (
		<RNImageBackground
			{...props}
			source={normalizeSource(source)}
			resizeMode={resizeModeForContentFit(contentFit) ?? props.resizeMode}
			style={imageStyle(style as RNImageProps['style'], contentFit)}
		/>
	);
}
