import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import {
	type ColorValue,
	darken,
	fromHsla,
	fromRgba,
	getAPCAContrastRatio,
	getAPCATextColor,
	toHsla,
	toRgbHex,
} from '@mary/color-fns';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { toNiceDomain } from '#/lib/strings/url-helpers';

import { niceDate } from '#/locale/intl/datetime';

import { EmbedThumb } from '#/components/EmbedThumb';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Clock_Stroke2_Corner0_Rounded as Clock } from '#/components/icons/Clock';
import { StandardSite } from '#/components/icons/community/StandardSite';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { ExternalLink, ExternalLinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

import * as styles from './index.css';
import { MetaRow } from './MetaRow';
import { matchStandardSitePublisher } from './publishers';
import { isStandardSitePublicationEmbed } from './utils';

type StandardSiteEmbedProps = {
	className?: string;
	onOpen?: () => void;
	/** Renders the card non-interactive for the composer preview. */
	preview?: boolean;
	view: AppBskyEmbedExternal.ViewExternal;
};

type ThemeColors = {
	accent: string;
	accentForeground: string;
	/** Darkened accent for the CTA button's hover state. */
	accentHover: string;
	/** Whether the accent/foreground pair clears APCA; the CTA button only tints itself when it does. */
	legible: boolean;
};

/** absolute APCA lightness contrast (Lc) held for the card's accent text */
const ACCENT_MIN_LC = 90;

/**
 * maximum hsl lightness points to shift a publisher's accent to reach {@link ACCENT_MIN_LC} before falling
 * back to default colors
 */
const MAX_ACCENT_DRIFT = 35;

const toHex = (color: ColorValue) => `#${toRgbHex(color)}`;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Shifts a color's HSL lightness by `delta` points (clamped to 0–100), preserving hue and saturation. */
const shiftLightness = (color: ColorValue, delta: number): ColorValue => {
	const [h, s, l] = toHsla(color);
	return fromHsla(h, s, clamp(l + delta, 0, 100));
};

/**
 * resolves a legible accent pair from a site's custom theme. honors the publisher's pair if it clears APCA;
 * otherwise, adjusts the accent color to achieve sufficient contrast against the text color. falls back to
 * the card's default colors if no accent is provided or if no legible adjustment is possible.
 */
function themeColorsFor(view: AppBskyEmbedExternal.ViewExternal): ThemeColors {
	const fallback: ThemeColors = {
		accent: colors.text,
		accentForeground: colors.textInverted,
		accentHover: colors.text,
		legible: false,
	};

	const { accentForegroundRGB, accentRGB } = view.source?.theme || {};
	if (!accentRGB) {
		return fallback;
	}

	const accent = fromRgba(accentRGB.r, accentRGB.g, accentRGB.b);
	const themed = (background: ColorValue, foreground: ColorValue): ThemeColors => ({
		accent: toHex(background),
		accentForeground: toHex(foreground),
		accentHover: toHex(darken(background, 0.1)),
		legible: true,
	});

	// Honor the publisher's own foreground when their pairing already reads.
	const publisherForeground = accentForegroundRGB
		? fromRgba(accentForegroundRGB.r, accentForegroundRGB.g, accentForegroundRGB.b)
		: null;
	if (
		publisherForeground !== null &&
		Math.abs(getAPCAContrastRatio(accent, publisherForeground)) >= ACCENT_MIN_LC
	) {
		return themed(accent, publisherForeground);
	}

	// Otherwise pick the higher-contrast text color and push the accent's lightness away from it — darker
	// under white text, lighter under black — until the pair clears the bar or drifts too far from the brand.
	const foreground = getAPCATextColor(accent);
	const direction = toRgbHex(foreground) === 'ffffff' ? -1 : 1;
	for (let drift = 0; drift <= MAX_ACCENT_DRIFT; drift++) {
		const background = shiftLightness(accent, drift * direction);
		if (Math.abs(getAPCAContrastRatio(background, foreground)) >= ACCENT_MIN_LC) {
			return themed(background, foreground);
		}
	}

	return fallback;
}

/**
 * Embed for a [standard site](https://standard.site) link: an article card, an article card with a
 * publication footer, or a standalone publication card.
 */
export function StandardSiteEmbed(props: StandardSiteEmbedProps) {
	if (isStandardSitePublicationEmbed(props.view)) {
		return <PublicationCard {...props} />;
	}
	return <ArticleCard {...props} />;
}

function ArticleCard({ className, onOpen, preview, view }: StandardSiteEmbedProps) {
	const niceUrl = toNiceDomain(view.uri);
	const open = () => onOpen?.();

	return (
		<div className={clsx(styles.card, preview && styles.previewLock, className)}>
			<ExternalLink
				className={styles.bodyLink}
				href={view.uri}
				label={view.title || m['common.a11y.openLink']({ niceUrl })}
				onPress={open}
			>
				{view.thumb ? <EmbedThumb src={view.thumb} /> : null}

				<div className={clsx(styles.body, view.thumb && styles.bodyMedia)}>
					<div className={styles.textBlock}>
						<Text numberOfLines={3} size="md" weight="bold">
							{view.title}
						</Text>

						{view.description ? (
							<Text numberOfLines={view.thumb ? 2 : 4} size="md_sub">
								{view.description}
							</Text>
						) : null}

						{view.createdAt || view.readingTime ? (
							<div className={styles.metaInline}>
								{view.createdAt ? (
									<Text color="textContrastMedium" size="xs">
										{niceDate(view.createdAt, 'long', 'none')}
									</Text>
								) : null}
								{view.readingTime ? (
									<span className={styles.readingTime}>
										<Clock size="xs" fill="currentColor" />
										<Text color="textContrastMedium" size="xs">
											{m['components.post.publication.readingTime']({ readingTime: view.readingTime })}
										</Text>
									</span>
								) : null}
							</div>
						) : null}
					</div>

					{!view.source ? (
						<div className={styles.metaSection}>
							<div className={styles.divider} />
							<div className={styles.metaRowPad}>
								<MetaRow view={view} />
							</div>
						</div>
					) : null}
				</div>
			</ExternalLink>

			{view.source ? (
				<>
					<div className={styles.divider} />
					<PublicationFooter onOpen={onOpen} view={view} />
				</>
			) : null}
		</div>
	);
}

function PublicationCard({ className, onOpen, preview, view }: StandardSiteEmbedProps) {
	if (!view.source) return null;
	const themeColors = themeColorsFor(view);
	const open = () => onOpen?.();

	return (
		<div className={clsx(styles.pubCard, preview && styles.previewLock, className)}>
			<ExternalLink
				className={styles.pubFill}
				href={view.source.uri}
				label={
					view.source.title
						? m['components.post.publication.action.viewSource']({ title: view.source.title })
						: m['components.post.publication.action.view']()
				}
				onPress={open}
			>
				{null}
			</ExternalLink>

			<div className={styles.pubTopRow}>
				<div className={styles.pubIdentity}>
					<PublicationIcon size="lg" themeColors={themeColors} view={view} />
					<div className={styles.identityText}>
						<Text color="text" numberOfLines={1} size="md" weight="semiBold">
							{view.source.title}
						</Text>
						<MetaRow type="publication" view={view} />
					</div>
				</div>

				<SubscribeButton className={styles.hideOnPhone} onOpen={onOpen} view={view} />
			</div>

			{view.description ? (
				<div className={styles.pubDescription}>
					<Text numberOfLines={3} size="sm">
						{view.description}
					</Text>
				</div>
			) : null}

			<SubscribeButton
				className={clsx(styles.pubSubscribeStacked, styles.hideOnGtPhone)}
				onOpen={onOpen}
				view={view}
			/>
		</div>
	);
}

function PublicationFooter({
	onOpen,
	view,
}: {
	onOpen?: () => void;
	view: AppBskyEmbedExternal.ViewExternal;
}) {
	if (!view.source) return null;
	const themeColors = themeColorsFor(view);
	const open = () => onOpen?.();

	return (
		<div className={styles.footer}>
			<ExternalLink
				className={styles.footerFill}
				href={view.source.uri}
				label={
					view.source.title
						? m['components.post.publication.action.viewSource']({ title: view.source.title })
						: m['components.post.publication.action.view']()
				}
				onPress={open}
				tabIndex={-1}
			>
				{null}
			</ExternalLink>

			<div className={styles.footerIdentity}>
				<PublicationIcon size="sm" themeColors={themeColors} view={view} />
				<div className={styles.identityText}>
					<Text className={styles.footerTitle} color="text" numberOfLines={1} size="sm" weight="medium">
						{view.source.title}
					</Text>
					<MetaRow type="publication" view={view} />
				</div>
			</div>

			<SubscribeButton onOpen={onOpen} view={view} />
		</div>
	);
}

function PublicationIcon({
	size,
	themeColors,
	view,
}: {
	size: 'lg' | 'sm';
	themeColors: ThemeColors;
	view: AppBskyEmbedExternal.ViewExternal;
}) {
	if (!view.source) return null;
	const px = size === 'lg' ? 40 : 32;

	return (
		<div className={styles.iconRoot}>
			<div className={styles.standardBadge}>
				<StandardSite size="xs" fill="currentColor" />
			</div>

			{view.source.icon ? (
				<div className={styles.avatarWrap}>
					<UserAvatar
						avatar={view.source.icon}
						className={styles.publicationAvatar}
						noBorder
						size={px}
						type="labeler"
					/>
					<span aria-hidden className={styles.avatarBorder} />
				</div>
			) : (
				<div
					className={clsx(styles.letterBox, size === 'lg' ? styles.letterBoxLg : styles.letterBoxSm)}
					style={assignInlineVars({
						[styles.accentForegroundVar]: themeColors.accentForeground,
						[styles.accentVar]: themeColors.accent,
					})}
				>
					<Text className={styles.letterText} size="xl" weight="bold">
						{[...view.source.title][0] ?? ''}
					</Text>
				</div>
			)}
		</div>
	);
}

function SubscribeButton({
	className,
	onOpen,
	view,
}: {
	className?: string;
	onOpen?: () => void;
	view: AppBskyEmbedExternal.ViewExternal;
}) {
	const highlightedPublisher = matchStandardSitePublisher(view);
	if (!view.source) return null;

	const publicationTitle = view.source.title;
	const label = highlightedPublisher
		? publicationTitle
			? m['components.post.publication.action.subscribeTo']({
					title: publicationTitle,
					name: highlightedPublisher.name,
				})
			: m['components.post.publication.action.subscribe']({ name: highlightedPublisher.name })
		: publicationTitle
			? m['components.post.publication.action.viewTitle']({ title: publicationTitle })
			: m['components.post.publication.action.view']();
	const cta = highlightedPublisher
		? m['components.post.publication.action.subscribe']({ name: highlightedPublisher.name })
		: m['components.post.publication.action.view']();

	/*
	 * The custom site theme paints the button background with `accent` and the text with `accentForeground`.
	 * Only honor it when the resolved pairing clears APCA (see `themeColorsFor`); otherwise fall through to the
	 * default `secondary_inverted` styling, which is guaranteed to be legible.
	 */
	const themeColors = themeColorsFor(view);
	let themeStyle: ReturnType<typeof assignInlineVars> | undefined;
	if (themeColors.legible) {
		themeStyle = assignInlineVars({
			// override the three palette vars the `secondary_inverted` button reads: idle bg, hover bg, text.
			[vars.palette.contrast_0]: themeColors.accentForeground,
			[vars.palette.contrast_900]: themeColors.accent,
			[vars.palette.contrast_975]: themeColors.accentHover,
		});
	}

	return (
		<ExternalLinkButton
			className={clsx(styles.subscribe, className)}
			color="secondary_inverted"
			href={view.source.uri}
			label={label}
			onPress={() => onOpen?.()}
			size="small"
			style={themeStyle}
		>
			{highlightedPublisher ? (
				<>
					<ButtonIcon icon={highlightedPublisher.Icon} size="md" />
					<ButtonText>{cta}</ButtonText>
				</>
			) : (
				<>
					<ButtonText>{cta}</ButtonText>
					<ButtonIcon icon={ArrowTopRightIcon} />
				</>
			)}
		</ExternalLinkButton>
	);
}
