import type { ReactNode } from 'react';

import clsx from 'clsx';

import { Text } from '#/components/Text';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './EditTextButton.css';

export function EditTextButton({
	children,
	className,
	label,
	onClick,
}: {
	children: ReactNode;
	className?: string;
	label: string;
	onClick?: () => void;
}) {
	return (
		<Button
			className={clsx(css.button, className)}
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
