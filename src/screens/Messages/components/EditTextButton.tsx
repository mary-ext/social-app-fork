import type { ReactNode } from 'react';

import { Text } from '#/components/Text';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './EditTextButton.css';

export function EditTextButton({
	children,
	label,
	onClick,
}: {
	children: ReactNode;
	label: string;
	onClick?: () => void;
}) {
	return (
		<Button
			className={css.button}
			color="secondary"
			label={label}
			size="large"
			variant="solid"
			onClick={onClick}
		>
			{children}

			<span className={css.editLabel}>
				<Text color="textContrastMedium" size="sm" weight="medium">
					{m['common.action.edit']()}
				</Text>
			</span>
		</Button>
	);
}
