import { View } from 'react-native';

import { atoms as a, useBreakpoints } from '#/alf';

import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';

import { vars } from '#/styles/contract.css';

export function SearchError({ title, children }: { title?: string; children?: React.ReactNode }) {
	const { gtMobile } = useBreakpoints();

	return (
		<Layout.Content>
			<View
				style={[
					a.align_center,
					a.gap_4xl,
					a.px_xl,
					{
						paddingVertical: 150,
					},
				]}
			>
				<XIcon width={32} fill={vars.palette.contrast_400} />
				<View style={[a.align_center, { maxWidth: gtMobile ? 394 : 294 }, gtMobile ? a.gap_md : a.gap_sm]}>
					<Text style={[a.font_semi_bold, a.text_lg, a.text_center, a.leading_snug]}>{title}</Text>
					{children}
				</View>
			</View>
		</Layout.Content>
	);
}
