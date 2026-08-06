import { lazy, type ReactElement, Suspense, useRef } from 'react';

import type { ActorIdentifier } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

import { PreviewCard } from '@base-ui/react/preview-card';

import { usePrefetchProfileQuery } from '#/state/queries/profile';
import { usePrefetchResolveDidQuery } from '#/state/queries/resolve-uri';

import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './ProfileHoverCard.css';

const Card = lazy(() => import('./Card').then((mod) => ({ default: mod.Card })));

export type ProfileHoverCardProps = {
	/** profile DID or handle. */
	actor: ActorIdentifier;
	/**
	 * trigger element. must forward a ref and spread DOM props onto its host node (used as
	 * {@link PreviewCard.Trigger}'s `render`).
	 */
	children: ReactElement;
};

/** profile preview shown on hover, built on Base UI's PreviewCard. wraps a single ref-forwarding trigger. */
export function ProfileHoverCard({ actor, children }: ProfileHoverCardProps) {
	const prefetchProfileQuery = usePrefetchProfileQuery();
	const prefetchResolveDidQuery = usePrefetchResolveDidQuery();
	const prefetched = useRef(false);

	const prefetchIfNeeded = () => {
		if (prefetched.current) {
			return;
		}
		prefetched.current = true;

		if (isDid(actor)) {
			void prefetchProfileQuery(actor);
		} else {
			void prefetchResolveDidQuery(actor);
		}
	};

	return (
		<PreviewCard.Root>
			<PreviewCard.Trigger render={children} onPointerMove={prefetchIfNeeded} />
			<PreviewCard.Portal>
				<PreviewCard.Positioner className={css.positioner} collisionPadding={16} sideOffset={4}>
					<PreviewCard.Popup className={css.popup}>
						<Suspense
							fallback={
								<div className={css.loadingCard}>
									<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
								</div>
							}
						>
							<Card actor={actor} />
						</Suspense>
					</PreviewCard.Popup>
				</PreviewCard.Positioner>
			</PreviewCard.Portal>
		</PreviewCard.Root>
	);
}
