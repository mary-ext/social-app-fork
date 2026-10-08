import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';

import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { useStarterPackLink } from '#/features/starter-packs/StarterPackCard';

import { BlockLink } from '#/components/BlockLink';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import Plus from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './StarterPackCard.css';

export function StarterPackCard({ view }: { view: AppBskyGraphDefs.StarterPackView }) {
	const { gtPhone } = useBreakpoints();
	const link = useStarterPackLink({ view });
	const record = getStarterPackRecord(view);

	const profileCount = gtPhone ? 11 : 8;
	const profiles = view.listItemsSample?.slice(0, profileCount).map((item) => item.subject);

	return (
		<BlockLink
			className={css.card}
			label={link.label}
			onBeforePress={link.precache}
			onPointerEnter={link.precache}
			to={link.to}
		>
			<div>
				<AvatarStack numPending={profileCount} profiles={profiles ?? []} total={view.list?.listItemCount} />

				<div className={css.body}>
					<div className={css.titleColumn}>
						<Text numberOfLines={1} size="md" weight="semiBold">
							{record.name}
						</Text>
						<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
							{m['screens.search.byCreator']({ handle: view.creator.handle })}
						</Text>
					</div>
					<LinkButton
						color="secondary"
						label={link.label}
						onPress={() => link.precache()}
						size="small"
						to={link.to}
						variant="solid"
					>
						<ButtonText>{m['screens.search.starterPack.open']()}</ButtonText>
					</LinkButton>
				</div>
			</div>
		</BlockLink>
	);
}

const AVATAR_SIZE_HINT = 64;

export function AvatarStack({
	numPending,
	profiles,
	total,
}: {
	numPending: number;
	profiles: AnyProfileView[];
	total?: number;
}) {
	const { gtPhone } = useBreakpoints();
	const moderationOpts = useModerationOpts();
	const computedTotal = (total ?? numPending) - numPending;

	const isPending = (numPending > 0 && profiles.length === 0) || !moderationOpts;
	const items = isPending
		? Array.from({ length: numPending }).map((_, i) => ({
				key: i,
				moderation: null,
				profile: null,
			}))
		: profiles.map((profile) => ({
				key: profile.did,
				moderation: moderateProfile(profile, moderationOpts),
				profile,
			}));

	return (
		<div
			className={css.stack}
			// include the count circle
			style={assignInlineVars({ [css.countVar]: String(numPending + 1) })}
		>
			{items.map((item, i) => (
				<div className={css.circle} key={item.key} style={assignInlineVars({ [css.zVar]: String(100 - i) })}>
					{item.profile ? (
						<UserAvatar
							avatar={item.profile.avatar}
							className={css.avatar}
							moderation={getDisplayRestrictions(item.moderation, DisplayContext.ProfileMedia)}
							// CSS sets dimensions; size controls thumbnail selection, borders, and badges
							size={AVATAR_SIZE_HINT}
							type={item.profile.associated?.labeler ? 'labeler' : 'user'}
						/>
					) : (
						<div className={css.placeholderBorder} />
					)}
				</div>
			))}
			<div className={css.total} style={assignInlineVars({ [css.zVar]: '1' })}>
				{computedTotal > 0 ? (
					<Text className={css.totalText} size={gtPhone ? 'md' : 'xs'} weight="semiBold">
						{m['screens.search.starterPack.additionalCount']({ count: computedTotal })}
					</Text>
				) : (
					<Plus className={css.plusIcon} />
				)}
			</div>
		</div>
	);
}

export function StarterPackCardSkeleton() {
	const { gtPhone } = useBreakpoints();
	const profileCount = gtPhone ? 11 : 8;
	return (
		<div className={css.card}>
			<AvatarStack numPending={profileCount} profiles={[]} />
			<div className={css.body}>
				<Skeleton.Col gap="xs" grow>
					<Skeleton.Text size="md" width={180} />
					<Skeleton.Text size="sm" width={120} />
				</Skeleton.Col>
				<div className={css.openPackPlaceholder} />
			</div>
		</div>
	);
}
