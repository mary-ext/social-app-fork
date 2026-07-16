import { useEffect, useRef, useState } from 'react';

import type { AnyProfileView, AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { useBreakpoints } from '#/alf/breakpoints';

import { BlockLink } from '#/components/BlockLink';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { useStarterPackLink } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';

import * as css from './StarterPackCard.css';

export function StarterPackCard({ view }: { view: AppBskyGraphDefs.StarterPackView }) {
	const { gtPhone } = useBreakpoints();
	const link = useStarterPackLink({ view });
	const record = view.record as AppBskyGraphStarterpack.Main;

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
	const circlesCount = numPending + 1; // add the count circle at the end
	const widthPerc = 100 / circlesCount;

	const [size, setSize] = useState<number | null>(null);
	const measureRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const el = measureRef.current;
		if (!el) return;
		const measure = () => setSize(el.getBoundingClientRect().width);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const isPending = (numPending && profiles.length === 0) || !moderationOpts;
	const items = isPending
		? Array.from({ length: numPending ?? circlesCount }).map((_, i) => ({
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
		<div className={css.stack} style={assignInlineVars({ [css.stackWidthVar]: `${100 - widthPerc * 0.2}%` })}>
			{items.map((item, i) => (
				<div
					className={css.cell}
					key={item.key}
					style={assignInlineVars({ [css.cellWidthVar]: `${widthPerc}%`, [css.cellZVar]: String(100 - i) })}
				>
					<div className={css.cellInner}>
						<div className={css.circle} ref={i === 0 ? measureRef : undefined}>
							{size && item.profile ? (
								<div className={css.avatarFill}>
									<UserAvatar
										avatar={item.profile.avatar}
										moderation={getDisplayRestrictions(item.moderation, DisplayContext.ProfileMedia)}
										size={size}
										type={item.profile.associated?.labeler ? 'labeler' : 'user'}
									/>
								</div>
							) : (
								<div className={css.placeholderBorder} />
							)}
						</div>
					</div>
				</div>
			))}
			<div
				className={css.cell}
				style={assignInlineVars({ [css.cellWidthVar]: `${widthPerc}%`, [css.cellZVar]: '1' })}
			>
				<div className={css.cellInner}>
					<div className={css.totalBox}>
						<div className={css.totalInner}>
							{computedTotal > 0 ? (
								<Text className={css.totalText} size={gtPhone ? 'md' : 'xs'} weight="semiBold">
									{m['screens.search.starterPack.additionalCount']({ count: computedTotal })}
								</Text>
							) : (
								<Plus fill="white" />
							)}
						</div>
					</div>
				</div>
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
				<Skeleton.Col gap="xs">
					<Skeleton.Text size="md" width={180} />
					<Skeleton.Text size="sm" width={120} />
				</Skeleton.Col>
				<div className={css.openPackPlaceholder} />
			</div>
		</div>
	);
}
