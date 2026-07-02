import { clsx } from 'clsx';

import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './ExternalEmbedRemoveBtn.css';

export function ExternalEmbedRemoveBtn({
	onRemove,
	className,
}: {
	onRemove: () => void;
	className?: string;
}) {
	return (
		<div className={clsx(styles.btn, className)}>
			<Button
				label={m['view.composer.media.removeAttachment']()}
				onClick={onRemove}
				size="small"
				variant="solid"
				color="secondary"
				shape="round"
			>
				<ButtonIcon icon={X} size="sm" />
			</Button>
		</div>
	);
}
