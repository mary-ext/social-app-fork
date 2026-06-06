import { useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { useLayoutBreakpoints } from '#/alf/breakpoints';

import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { Button, ButtonIcon } from '#/components/web/Button';
import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Layout/Header.css';
import { Text } from '#/components/web/Text';

export function Outer({
	children,
	noBottomBorder,
	sticky = true,
}: {
	children: React.ReactNode;
	noBottomBorder?: boolean;
	sticky?: boolean;
}) {
	const { centerColumnOffset } = useLayoutBreakpoints();
	return (
		<div
			className={cx(
				styles.outer,
				noBottomBorder && styles.outerNoBorder,
				!sticky && styles.outerStatic,
				centerColumnOffset && styles.outerOffset,
			)}
		>
			{children}
		</div>
	);
}

export function Content({ children }: { children?: React.ReactNode }) {
	return <div className={styles.content}>{children}</div>;
}

export function Slot({ children }: { children?: React.ReactNode }) {
	return <div className={styles.slot}>{children}</div>;
}

export function TitleText({ children }: { children: React.ReactNode }) {
	return (
		<Text weight="semiBold" leading="tight" numberOfLines={2} className={styles.title}>
			{children}
		</Text>
	);
}

export function BackButton() {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();

	const onClick = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	}, [navigation]);

	return (
		<Slot>
			<Button
				label={l`Go back`}
				variant="ghost"
				color="secondary"
				shape="round"
				className={styles.backButton}
				onClick={onClick}
			>
				<ButtonIcon icon={ArrowLeft} size="lg" />
			</Button>
		</Slot>
	);
}
