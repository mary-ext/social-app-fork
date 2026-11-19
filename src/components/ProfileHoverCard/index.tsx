import { lazy, type ReactElement, type RefObject, Suspense, useRef } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ActorIdentifier } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';

import { setElementVars } from '@vanilla-extract/dynamic';

import { usePrefetchResolveDidQuery } from '#/state/queries/identity/resolve-uri';
import { usePrefetchProfileQuery } from '#/state/queries/profile/profile';

import * as PreviewCard from '#/components/primitives/preview-card';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './ProfileHoverCard.css';

const Card = lazy(() => import('./Card').then((mod) => ({ default: mod.Card })));

export type ProfileHoverCardProps = (
	| {
			/** profile DID or handle; shows a loading state until the profile resolves. */
			actor: ActorIdentifier;
			profile?: never;
	  }
	| {
			actor?: never;
			/** profile view to show while the detailed profile loads; prefer this over `actor`. */
			profile: AnyProfileView;
	  }
) & {
	/** trigger element; must forward its ref and DOM props to the host node. */
	children: ReactElement;
};

/** profile preview shown on hover or keyboard focus. */
export function ProfileHoverCard({ actor, profile, children }: ProfileHoverCardProps) {
	const prefetchProfileQuery = usePrefetchProfileQuery();
	const prefetchResolveDidQuery = usePrefetchResolveDidQuery();
	const prefetched = useRef(false);
	const contentRef = useRef<HTMLDivElement>(null);

	const prefetchIfNeeded = () => {
		if (prefetched.current) {
			return;
		}
		prefetched.current = true;

		if (profile) {
			void prefetchProfileQuery(profile.did);
		} else if (isDid(actor)) {
			void prefetchProfileQuery(actor);
		} else {
			void prefetchResolveDidQuery(actor);
		}
	};

	return (
		<PreviewCard.Root>
			<PreviewCard.Trigger render={children} onPointerMove={prefetchIfNeeded} />
			<PreviewCard.Positioner collisionPadding={16} sideOffset={4}>
				<PreviewCard.Popup ref={(popup) => trackContentSize(popup, contentRef)} className={css.popup}>
					<div ref={contentRef} className={css.content}>
						<Suspense
							fallback={
								<div className={css.loadingCard}>
									<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
								</div>
							}
						>
							<Card profile={profile ?? actor} />
						</Suspense>
					</div>
				</PreviewCard.Popup>
			</PreviewCard.Positioner>
		</PreviewCard.Root>
	);
}

// an explicit size lets the popup transition between content sizes; `auto` to `auto` can't animate.
// child refs attach first, so the content element is available here.
const trackContentSize = (popup: HTMLDivElement | null, contentRef: RefObject<HTMLDivElement | null>) => {
	const content = contentRef.current;
	if (!popup || !content) {
		return;
	}

	// the first size lands before paint and from `auto`, so the popup opens without resizing.
	const observer = new ResizeObserver((entries) => {
		const size = entries[0]?.borderBoxSize[0];
		if (!size) {
			return;
		}
		setElementVars(popup, {
			[css.contentSizeVars.blockSize]: `${size.blockSize}px`,
			[css.contentSizeVars.inlineSize]: `${size.inlineSize}px`,
		});
	});

	observer.observe(content);

	return () => {
		observer.disconnect();
	};
};
