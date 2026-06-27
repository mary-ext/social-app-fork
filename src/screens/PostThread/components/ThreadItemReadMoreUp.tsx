import type { ThreadItem } from '#/state/queries/usePostThread';

import { OUTER_SPACE } from '#/screens/PostThread/const';

import { atoms as a } from '#/alf';

import { ArrowTopCircle_Stroke2_Corner0_Rounded as UpIcon } from '#/components/icons/ArrowTopCircle';
import { Link } from '#/components/Link';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ThreadItemReadMoreUp.css';

export function ThreadItemReadMoreUp({ item }: { item: Extract<ThreadItem, { type: 'readMoreUp' }> }) {
	return (
		<Link
			label={m['screens.postThread.action.continueThread']()}
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
								<UpIcon fill={interacted ? colors.textContrastHigh : colors.textContrastLow} width={24} />
							</div>
							<Text size="sm" color="textContrastMedium" className={interacted ? css.underline : undefined}>
								{m['screens.postThread.action.continueThreadMore']()}
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
}
