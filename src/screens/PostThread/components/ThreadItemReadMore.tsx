import { memo } from 'react';
import { useLingui, Plural, Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';

import type { PostThreadParams, ThreadItem } from '#/state/queries/usePostThread';

import { atoms as a, useTheme } from '#/alf';

import { CirclePlus_Stroke2_Corner0_Rounded as CirclePlus } from '#/components/icons/CirclePlus';
import { Link } from '#/components/Link';
import { Text } from '#/components/web/Text';

import * as css from './ThreadItemReadMore.css';

export const ThreadItemReadMore = memo(function ThreadItemReadMore({
	item,
	view,
}: {
	item: Extract<ThreadItem, { type: 'readMore' }>;
	view: PostThreadParams['view'];
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const isTreeView = view === 'tree';
	const indent = Math.max(0, item.depth - 1);

	const spacers = isTreeView
		? Array.from(Array(indent)).map((_, n: number) => {
				const isSkipped = item.skippedIndentIndices.has(n);
				return (
					<div key={`${item.key}-padding-${n}`} className={clsx(css.guide, isSkipped && css.guideSkipped)} />
				);
			})
		: null;

	return (
		<div className={css.outer}>
			{spacers}
			<div className={clsx(css.connectorBase, isTreeView ? css.connectorTree : css.connectorLinear)} />
			<Link label={l`Read more replies`} to={item.href} style={[a.pt_sm, a.pb_md, a.gap_xs]}>
				{({ hovered, pressed }) => {
					const interacted = hovered || pressed;
					return (
						<>
							<CirclePlus
								fill={interacted ? t.atoms.text_contrast_high.color : t.atoms.text_contrast_low.color}
								width={18}
							/>
							<Text size="sm" color="textContrastMedium" className={interacted ? css.underline : undefined}>
								<Trans>
									Read <Plural one="# more reply" other="# more replies" value={item.moreReplies} />
								</Trans>
							</Text>
						</>
					);
				}}
			</Link>
		</div>
	);
});
