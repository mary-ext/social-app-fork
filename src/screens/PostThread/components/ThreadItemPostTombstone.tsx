import { Text } from '#/components/Text';

import PersonXIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ThreadItemPostTombstone.css';

export type ThreadItemPostTombstoneProps = {
	type: 'not-found' | 'blocked';
};

export function ThreadItemPostTombstone({ type }: ThreadItemPostTombstoneProps) {
	let copy: string;
	let Icon: typeof PersonXIcon;
	switch (type) {
		case 'blocked': {
			copy = m['screens.postThread.post.error.blocked']();
			Icon = PersonXIcon;
			break;
		}
		case 'not-found':
		default: {
			copy = m['screens.postThread.post.error.notFound']();
			Icon = TrashIcon;
			break;
		}
	}

	return (
		<div className={css.outer}>
			<div className={css.row}>
				<div className={css.iconCell}>
					<Icon className={css.icon} />
				</div>
				<Text size="md" weight="semiBold" color="textContrastMedium">
					{copy}
				</Text>
			</div>
		</div>
	);
}
