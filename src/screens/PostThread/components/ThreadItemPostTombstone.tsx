import { useMemo } from 'react';

import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './ThreadItemPostTombstone.css';

export type ThreadItemPostTombstoneProps = {
	type: 'not-found' | 'blocked';
};

export function ThreadItemPostTombstone({ type }: ThreadItemPostTombstoneProps) {
	const { copy, Icon } = useMemo(() => {
		switch (type) {
			case 'blocked':
				return { copy: m['screens.postThread.post.error.blocked'](), Icon: PersonXIcon };
			case 'not-found':
			default:
				return { copy: m['screens.postThread.post.error.notFound'](), Icon: TrashIcon };
		}
	}, [type]);

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
