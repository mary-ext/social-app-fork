import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './ThreadItemPostTombstone.css';

export type ThreadItemPostTombstoneProps = {
	type: 'not-found' | 'blocked';
};

export function ThreadItemPostTombstone({ type }: ThreadItemPostTombstoneProps) {
	let copy: string;
	let Icon: typeof PersonXIcon;
	switch (type) {
		case 'blocked':
			copy = m['screens.postThread.post.error.blocked']();
			Icon = PersonXIcon;
			break;
		case 'not-found':
		default:
			copy = m['screens.postThread.post.error.notFound']();
			Icon = TrashIcon;
			break;
	}

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
