import { View } from 'react-native';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { atoms as a, useTheme } from '#/alf';

import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function ThreadItemAnchorNoUnauthenticated() {
	const t = useTheme();

	return (
		<View style={[a.p_lg, a.gap_md]}>
			<Skele.Row style={[a.align_center, a.gap_md]}>
				<Skele.Circle size={LINEAR_AVI_WIDTH}>
					<LockIcon size="lg" fill={colors.textContrastMedium} />
				</Skele.Circle>

				<Skele.Col>
					<Skele.Text style={[a.text_lg, { width: '20%' }]} />
					<Skele.Text blend style={[a.text_md, { width: '40%' }]} />
				</Skele.Col>
			</Skele.Row>
			<View style={[a.py_sm]}>
				<Text style={[a.text_xl, a.italic, t.atoms.text_contrast_medium]}>
					{m['screens.postThread.visibility.signedInOnly']()}
				</Text>
			</View>
		</View>
	);
}
