import type { AppBskyActorDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';

import { makeProfileLink } from '#/lib/routes/links';

import { Trans } from '#/locale/Trans';

import { StarterPack } from '#/components/icons/StarterPack';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './StarterPackHeader.css';

/**
 * profile-subpage header card for a starter pack: the starter-pack glyph, the pack's title, and a "by …"
 * byline, followed by the description, a sign-in prompt for logged-out viewers, and the join count.
 *
 * @param onPressSignIn invoked when a logged-out viewer taps the sign-in prompt
 */
export function StarterPackHeader({
	creator,
	hasSession,
	isOwn,
	joinedAllTimeCount,
	onPressSignIn,
	record,
}: {
	creator: AppBskyActorDefs.ProfileViewBasic;
	hasSession: boolean;
	isOwn: boolean;
	joinedAllTimeCount: number;
	onPressSignIn: () => void;
	record: AppBskyGraphStarterpack.Main;
}) {
	const descriptionRT = record.description
		? {
				facets: record.descriptionFacets ?? [],
				text: record.description,
			}
		: undefined;

	return (
		<div className={css.outer}>
			<div className={css.header}>
				<div className={css.avatar}>
					<StarterPack width={56} gradient="sky" />
				</div>
				<div className={css.content}>
					<Text size="xl" weight="semiBold" numberOfLines={2}>
						{record.name || ''}
					</Text>
					<Text color="textContrastMedium" numberOfLines={1}>
						{isOwn ? (
							m['common.starterPack.byYou']()
						) : (
							<Trans
								message={m['view.profile.starterPack.by']}
								markup={{
									t0: () => (
										<InlineLinkText
											to={makeProfileLink(creator)}
											label={m['screens.profile.avatar.a11y.viewProfile']({ handle: creator.handle })}
											color="textContrastMedium"
										>
											{creator.handle}
										</InlineLinkText>
									),
								}}
							/>
						)}
					</Text>
				</div>
			</div>
			{descriptionRT ? <RichText value={descriptionRT} /> : null}
			{!hasSession ? (
				<Button
					label={m['common.session.action.signIn']()}
					variant="solid"
					color="primary"
					size="large"
					onClick={onPressSignIn}
				>
					<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
				</Button>
			) : null}
			{joinedAllTimeCount >= 25 ? (
				<div className={css.joinedRow}>
					<TrendingIcon size="xs" fill={colors.textContrastMedium} />
					<Text weight="semiBold" size="sm" color="textContrastMedium">
						{m['screens.starterPack.joinedCount']({ count: joinedAllTimeCount })}
					</Text>
				</div>
			) : null}
		</div>
	);
}
