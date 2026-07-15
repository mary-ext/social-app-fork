import { lazy, type ReactElement, Suspense, useRef } from 'react';

import { PreviewCard } from '@base-ui/react/preview-card';

import { usePrefetchProfileQuery } from '#/state/queries/profile';

import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './ProfileHoverCard.css';

const Card = lazy(() => import('./Card').then((mod) => ({ default: mod.Card })));

export type ProfileHoverCardProps = {
	/**
	 * trigger element. must forward a ref and spread DOM props onto its host node (used as
	 * {@link PreviewCard.Trigger}'s `render`).
	 */
	children: ReactElement;
	did: string;
};

/** profile preview shown on hover, built on Base UI's PreviewCard. wraps a single ref-forwarding trigger. */
export function ProfileHoverCard({ children, did }: ProfileHoverCardProps) {
	const prefetchProfileQuery = usePrefetchProfileQuery();
	const prefetched = useRef(false);

	const prefetchIfNeeded = () => {
		if (!prefetched.current) {
			prefetched.current = true;
			void prefetchProfileQuery(did);
		}
	};

	return (
		<PreviewCard.Root>
			<PreviewCard.Trigger
				render={children}
				// closeDelay={HIDE_DELAY}
				// delay={SHOW_DELAY}
				// warm the cache as soon as the pointer lands so the card has data before the open delay elapses
				onPointerMove={prefetchIfNeeded}
			/>
			<PreviewCard.Portal>
				<PreviewCard.Positioner className={css.positioner} collisionPadding={16} sideOffset={4}>
					<PreviewCard.Popup className={css.popup}>
						<Suspense
							fallback={
								<div className={css.loadingCard}>
									<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
								</div>
							}
						>
							<Card did={did} />
						</Suspense>
					</PreviewCard.Popup>
				</PreviewCard.Positioner>
			</PreviewCard.Portal>
		</PreviewCard.Root>
	);
}
