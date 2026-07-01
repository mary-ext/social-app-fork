import { TouchableOpacity } from 'react-native';

import { HITSLOP_10 } from '#/lib/constants';

import { GifAltTextDialog } from '#/view/com/composer/GifAltTextDialog';

import { atoms as a, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';

import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type Props = {
	altText: string;
	gif: Gif;
	onSubmit: (alt: string) => void;
};

export function GifAltText({ altText, gif, onSubmit }: Props): React.ReactNode {
	const t = useTheme();
	const handle = Dialog.useDialogHandle();

	return (
		<>
			<TouchableOpacity
				accessibilityHint=""
				accessibilityLabel={m['view.composer.altText.action.add']()}
				accessibilityRole="button"
				hitSlop={HITSLOP_10}
				onPress={() => handle.open(null)}
				style={[
					a.absolute,
					a.flex_row,
					a.align_center,
					a.gap_xs,
					a.pl_xs,
					a.pr_sm,
					a.py_2xs,
					{ top: 8, left: 8, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
				]}
			>
				{altText ? (
					<Check size="xs" fill={colors.white} style={a.ml_xs} />
				) : (
					<Plus size="sm" fill={colors.white} />
				)}
				<Text style={[a.font_semi_bold, { color: t.palette.white }]} accessible={false}>
					{m['common.altText.badge']()}
				</Text>
			</TouchableOpacity>

			<Admonition type="info" style={[a.mt_sm]}>
				{m['view.composer.altText.hint']()}
			</Admonition>

			<GifAltTextDialog altText={altText} gif={gif} handle={handle} onSubmit={onSubmit} />
		</>
	);
}
