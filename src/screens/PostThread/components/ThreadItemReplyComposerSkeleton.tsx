import { useBreakpoints } from '#/lib/hooks/use-breakpoints';

import * as Skele from '#/components/web/Skeleton';

import * as css from './ThreadItemReplyComposerSkeleton.css';

export function ThreadItemReplyComposerSkeleton() {
	const { gtMobile } = useBreakpoints();

	if (!gtMobile) {
		return null;
	}

	return (
		<div className={css.outer}>
			<div className={css.row}>
				<Skele.Circle size={24} />
				<Skele.Text size="md" width={119} />
			</div>
		</div>
	);
}
