// adapter: sized <Image> + contentFit→resizeMode mapping, prefetch/cache no-ops, expo-image-shape
// onLoad event. final state for the fork.

import { type ComponentRef, forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import { Image as RNImage, type ImageProps as RNImageProps } from 'react-native';

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
	loading?: 'eager' | 'lazy';
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

// oxlint-disable-next-line no-shadow -- the function expression is named to match the export so it shows up as `Image` in devtools
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
				const loaded = event.nativeEvent?.source ?? {};
				onLoad?.({
					source: {
						width: loaded.width ?? 0,
						height: loaded.height ?? 0,
						uri: loaded.uri,
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
Image.clearDiskCache = () => Promise.resolve(true);
Image.clearMemoryCache = () => Promise.resolve(true);
