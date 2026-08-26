import type { PostNumbering } from '#/state/queries/feed-tuner';

import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './PostNumber.css';

function Badge({ className, value }: { className: string; value: PostNumbering }) {
	const { index, count } = value;

	return (
		<Text
			role="img"
			aria-label={m['components.post.number.a11y.position']({ index, count })}
			className={className}
			color="textContrastMedium"
			size="xs"
			weight="medium"
		>
			{m['components.post.number.badge']({ index, count })}
		</Text>
	);
}

/**
 * renders a thread position after post text.
 *
 * @param props badge properties
 * @returns the position badge
 */
export function PostNumber({ value }: { value: PostNumbering }) {
	return <Badge className={css.inline} value={value} />;
}

/**
 * renders a thread position on its own line.
 *
 * @param props badge properties
 * @returns the position badge
 */
export function PostNumberBlock({ value }: { value: PostNumbering }) {
	return <Badge className={css.block} value={value} />;
}
