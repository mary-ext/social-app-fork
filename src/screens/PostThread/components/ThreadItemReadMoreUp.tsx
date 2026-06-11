import { memo } from 'react';
import { useLingui, Trans } from '@lingui/react/macro';

import type { ThreadItem } from '#/state/queries/usePostThread';

import { OUTER_SPACE } from '#/screens/PostThread/const';

import { atoms as a, useTheme } from '#/alf';

import { ArrowTopCircle_Stroke2_Corner0_Rounded as UpIcon } from '#/components/icons/ArrowTopCircle';
import { Link } from '#/components/Link';
import { Text } from '#/components/web/Text';

import * as css from './ThreadItemReadMoreUp.css';

export const ThreadItemReadMoreUp = memo(function ThreadItemReadMoreUp({
	item,
}: {
	item: Extract<ThreadItem, { type: 'readMoreUp' }>;
}) {
	const t = useTheme();
	const { t: l } = useLingui();

	return (
		<Link
			label={l`Continue thread`}
			to={item.href}
			style={[
				a.gap_xs,
				{
					paddingTop: OUTER_SPACE,
					paddingHorizontal: OUTER_SPACE,
				},
			]}
		>
			{({ hovered, pressed }) => {
				const interacted = hovered || pressed;
				return (
					<div>
						<div className={css.rowTop}>
							<div className={css.iconCell}>
								<UpIcon
									fill={interacted ? t.atoms.text_contrast_high.color : t.atoms.text_contrast_low.color}
									width={24}
								/>
							</div>
							<Text size="sm" color="textContrastMedium" className={interacted ? css.underline : undefined}>
								<Trans>Continue thread...</Trans>
							</Text>
						</div>
						<div className={css.iconCell}>
							<div className={css.lineStub} />
						</div>
					</div>
				);
			}}
		</Link>
	);
});
