import { type ReactNode, useMemo } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import { type AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';

import { detectFacetsWithoutResolution, type Richtext } from '#/lib/strings/rich-text-facets';
import { toShortUrl } from '#/lib/strings/url-helpers';

import { atoms as a, flatten, type TextStyleProp } from '#/alf';
import { isOnlyEmoji } from '#/alf/typography';

import { InlineLinkText, type LinkProps } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { RichTextTag } from '#/components/RichTextTag';
import { Text, type TextProps } from '#/components/Typography';

const WORD_WRAP = { wordWrap: 1 };
// lifted from facet detection in `RichText` impl, _without_ `gm` flags
const URL_REGEX = /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/i;

type Feature = AppBskyRichtextFacet.Main['features'][number];

export type RichTextProps = TextStyleProp &
	Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
		value: Richtext | string;
		testID?: string;
		numberOfLines?: number;
		disableLinks?: boolean;
		enableTags?: boolean;
		authorHandle?: string;
		onLinkPress?: LinkProps['onPress'];
		interactiveStyle?: StyleProp<TextStyle>;
		emojiMultiplier?: number;
		/**
		 * DANGEROUS: Disable facet lexicon validation
		 *
		 * `detectFacetsWithoutResolution()` generates technically invalid facets, with a handle in place of the
		 * DID. This means that RichText that uses it won't be able to render links.
		 *
		 * Use with care - only use if you're rendering facets you're generating yourself.
		 */
		disableMentionFacetValidation?: true;
	};

export function RichText({
	testID,
	value,
	style,
	numberOfLines,
	disableLinks,
	selectable,
	enableTags = false,
	authorHandle,
	onLinkPress,
	interactiveStyle,
	emojiMultiplier = 1.85,
	onLayout,
	onTextLayout,
	disableMentionFacetValidation,
}: RichTextProps) {
	const { text, facets } = useMemo(() => {
		return typeof value === 'string' ? detectFacetsWithoutResolution(value) : value;
	}, [value]);

	const plainStyles = [a.leading_snug, style];
	const interactiveStyles = [plainStyles, interactiveStyle];

	if (!facets?.length) {
		if (isOnlyEmoji(text)) {
			const flattenedStyle = flatten(style) ?? {};
			const fontSize = (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier;
			return (
				<Text
					emoji
					selectable={selectable}
					testID={testID}
					style={[plainStyles, { fontSize }]}
					onLayout={onLayout}
					onTextLayout={onTextLayout}
					// @ts-ignore web only -prf
					dataSet={WORD_WRAP}
				>
					{text}
				</Text>
			);
		}
		return (
			<Text
				emoji
				selectable={selectable}
				testID={testID}
				style={plainStyles}
				numberOfLines={numberOfLines}
				onLayout={onLayout}
				onTextLayout={onTextLayout}
				// @ts-ignore web only -prf
				dataSet={WORD_WRAP}
			>
				{text}
			</Text>
		);
	}

	const els: ReactNode[] = [];
	let key = 0;
	for (const segment of segmentize<Feature>(text, facets)) {
		let el: ReactNode = segment.text;

		// Render the first feature we support, in array order — a facet's `features` can carry more
		// than one, and we take whichever comes first rather than imposing a type precedence.
		features: for (const feature of segment.features ?? []) {
			switch (feature.$type) {
				case 'app.bsky.richtext.facet#mention': {
					if (!disableLinks && (disableMentionFacetValidation || feature.did.startsWith('did:'))) {
						el = (
							<ProfileHoverCard key={key} did={feature.did}>
								<InlineLinkText
									selectable={selectable}
									to={`/profile/${feature.did}`}
									style={interactiveStyles}
									// @ts-ignore TODO
									dataSet={WORD_WRAP}
									onPress={onLinkPress}
								>
									{segment.text}
								</InlineLinkText>
							</ProfileHoverCard>
						);
					}
					break features;
				}
				case 'app.bsky.richtext.facet#link': {
					const isValidLink = URL_REGEX.test(feature.uri);
					if (!isValidLink || disableLinks) {
						el = toShortUrl(segment.text);
					} else {
						el = (
							<InlineLinkText
								selectable={selectable}
								key={key}
								to={feature.uri}
								style={interactiveStyles}
								// @ts-ignore TODO
								dataSet={WORD_WRAP}
								shareOnLongPress
								onPress={onLinkPress}
								emoji
							>
								{toShortUrl(segment.text)}
							</InlineLinkText>
						);
					}
					break features;
				}
				case 'app.bsky.richtext.facet#tag': {
					if (!disableLinks && enableTags) {
						el = (
							<RichTextTag
								key={key}
								display={segment.text}
								tag={feature.tag}
								textStyle={interactiveStyles}
								authorHandle={authorHandle}
							/>
						);
					}
					break features;
				}
			}
		}

		els.push(el);
		key++;
	}

	return (
		<Text
			emoji
			selectable={selectable}
			testID={testID}
			style={plainStyles}
			numberOfLines={numberOfLines}
			onLayout={onLayout}
			onTextLayout={onTextLayout}
			// @ts-ignore web only -prf
			dataSet={WORD_WRAP}
		>
			{els}
		</Text>
	);
}
