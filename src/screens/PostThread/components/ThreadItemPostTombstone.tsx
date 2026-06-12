import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';

import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Text } from '#/components/Text';

import * as css from './ThreadItemPostTombstone.css';

export type ThreadItemPostTombstoneProps = {
	type: 'not-found' | 'blocked';
};

export function ThreadItemPostTombstone({ type }: ThreadItemPostTombstoneProps) {
	const { t: l } = useLingui();
	const { copy, Icon } = useMemo(() => {
		switch (type) {
			case 'blocked':
				return { copy: l`Post blocked`, Icon: PersonXIcon };
			case 'not-found':
			default:
				return { copy: l`Post not found`, Icon: TrashIcon };
		}
	}, [l, type]);

	return (
		<div className={css.outer}>
			<div className={css.row}>
				<div className={css.iconCell}>
					<Icon fill="currentColor" />
				</div>
				<Text size="md" weight="semiBold" color="textContrastMedium">
					{copy}
				</Text>
			</div>
		</div>
	);
}
