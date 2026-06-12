import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { niceDate } from '#/lib/strings/time';
import { toNiceDomain } from '#/lib/strings/url-helpers';

import { contrastRatio, darken, rgbToHex } from '#/alf/util/colorGeneration';

import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon } from '#/components/icons/Arrow';
import { Clock_Stroke2_Corner0_Rounded as Clock } from '#/components/icons/Clock';
import { StandardSite } from '#/components/icons/community/StandardSite';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { Link, LinkButton } from '#/components/web/Link';
import { MediaInsetBorder } from '#/components/web/MediaInsetBorder';
import { Text } from '#/components/web/Text';
import { UserAvatar } from '#/components/web/UserAvatar';

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

type ThemeColors = { accent: string; accentForeground: string };

/** Resolves a site's custom accent pair, falling back to the themed text colors. */
function themeColorsFor(view: AppBskyEmbedExternal.ViewExternal): ThemeColors {
	const { accentForegroundRGB, accentRGB } = view.source?.theme || {};
	if (accentRGB && accentForegroundRGB) {
		return {
			accent: rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b),
			accentForeground: rgbToHex(accentForegroundRGB.r, accentForegroundRGB.g, accentForegroundRGB.b),
		};
	}
	return { accent: colors.text, accentForeground: colors.textInverted };
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
	const { i18n, t: l } = useLingui();
	const niceUrl = toNiceDomain(view.uri);
	const hasMedia = Boolean(view.thumb);
	const isStandard = view.associatedRefs?.some((ref) =>
		parseCanonicalResourceUri(ref.uri).collection.startsWith('site.standard.'),
	);
	const open = () => onOpen?.();

	return (
		<div className={clsx(styles.card, preview && styles.previewLock, className)}>
			<Link
				className={styles.bodyLink}
				label={view.title || l`Open link to ${niceUrl}`}
				onPress={open}
				to={view.uri}
			>
				{view.thumb ? <img alt="" className={styles.thumb} loading="lazy" src={view.thumb} /> : null}

				<div className={clsx(styles.body, isStandard && styles.bodyStandard, hasMedia && styles.bodyMedia)}>
					<div className={clsx(styles.textBlock, isStandard && styles.textBlockStandard)}>
						<Text
							leading="snug"
							numberOfLines={3}
							size={isStandard ? 'lg' : 'md'}
							weight={isStandard ? 'bold' : 'semiBold'}
						>
							{view.title}
						</Text>

						{view.description ? (
							<Text leading="snug" numberOfLines={view.thumb ? 2 : 4} size="sm">
								{view.description}
							</Text>
						) : null}

						{isStandard && (view.createdAt || view.readingTime) ? (
							<div className={styles.metaInline}>
								{view.createdAt ? (
									<Text color="textContrastMedium" leading="snug" size="xs">
										{niceDate(i18n, view.createdAt, 'long', 'none')}
									</Text>
								) : null}
								{view.readingTime ? (
									<span className={styles.readingTime}>
										<Clock size="xs" fill="currentColor" />
										<Text color="textContrastMedium" leading="snug" size="xs">
											{l({
												comment: `How long it takes to read an article, in minutes. Displayed in a short form, e.g. "5m" for 5 minutes.`,
												message: plural(view.readingTime, { one: '#m', other: '#m' }),
											})}
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
			</Link>

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
	const { t: l } = useLingui();
	if (!view.source) return null;
	const themeColors = themeColorsFor(view);
	const open = () => onOpen?.();

	return (
		<div className={clsx(styles.pubCard, preview && styles.previewLock, className)}>
			<Link
				className={styles.pubFill}
				label={view.source.title ? l`View ${view.source.title}` : l`View publication`}
				onPress={open}
				to={view.source.uri}
			>
				{null}
			</Link>

			<div className={styles.pubTopRow}>
				<div className={styles.pubIdentity}>
					<PublicationIcon size="lg" themeColors={themeColors} view={view} />
					<div className={styles.identityText}>
						<Text color="text" leading="snug" numberOfLines={1} size="md" weight="semiBold">
							{view.source.title}
						</Text>
						<MetaRow type="publication" view={view} />
					</div>
				</div>

				<SubscribeButton className={styles.hideOnPhone} onOpen={onOpen} view={view} />
			</div>

			{view.description ? (
				<div className={styles.pubDescription}>
					<Text leading="snug" numberOfLines={3} size="sm">
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
	const { t: l } = useLingui();
	if (!view.source) return null;
	const themeColors = themeColorsFor(view);
	const open = () => onOpen?.();

	return (
		<div className={styles.footer}>
			<Link
				className={styles.footerFill}
				label={view.source.title ? l`View ${view.source.title}` : l`View publication`}
				onPress={open}
				to={view.source.uri}
			>
				{null}
			</Link>

			<div className={styles.footerIdentity}>
				<PublicationIcon size="sm" themeColors={themeColors} view={view} />
				<div className={styles.identityText}>
					<Text
						className={styles.footerTitle}
						color="text"
						leading="tight"
						numberOfLines={1}
						size="sm"
						weight="medium"
					>
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
				<MediaInsetBorder className={styles.insetRoundedFull} />
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
					<MediaInsetBorder className={styles.insetRoundedSm} opaque />
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
					<MediaInsetBorder className={styles.insetRoundedSm} opaque />
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
	const { t: l } = useLingui();
	const highlightedPublisher = matchStandardSitePublisher(view);
	if (!view.source) return null;

	const publicationTitle = view.source.title;
	const label = highlightedPublisher
		? publicationTitle
			? l`Subscribe to ${publicationTitle} on ${highlightedPublisher.name}`
			: l`Subscribe on ${highlightedPublisher.name}`
		: publicationTitle
			? l`View ${publicationTitle}`
			: l`View publication`;
	const cta = highlightedPublisher ? l`Subscribe on ${highlightedPublisher.name}` : l`View publication`;

	/*
	 * The custom site theme paints the button background with `accent` and the text with `accentForeground`.
	 * Only honor it when that pairing clears WCAG AAA (4.5:1) for large text, which the button's bold label
	 * qualifies as. Otherwise fall through to the default `secondary_inverted` styling, which is guaranteed to
	 * be legible.
	 */
	const { accentForegroundRGB, accentRGB } = view.source.theme || {};
	let themeStyle: ReturnType<typeof assignInlineVars> | undefined;
	if (accentRGB && accentForegroundRGB) {
		const accent = rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b);
		const accentForeground = rgbToHex(accentForegroundRGB.r, accentForegroundRGB.g, accentForegroundRGB.b);
		const ratio = contrastRatio(accent, accentForeground);
		if (ratio !== null && ratio >= 4.5) {
			themeStyle = assignInlineVars({
				// override the three palette vars the `secondary_inverted` button reads: idle bg, hover bg, text.
				[vars.palette.contrast_0]: accentForeground,
				[vars.palette.contrast_900]: accent,
				[vars.palette.contrast_975]: darken(accent, 5),
			});
		}
	}

	return (
		<LinkButton
			className={clsx(styles.subscribe, className)}
			color="secondary_inverted"
			label={label}
			onPress={() => onOpen?.()}
			size="small"
			style={themeStyle}
			to={view.source.uri}
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
		</LinkButton>
	);
}
