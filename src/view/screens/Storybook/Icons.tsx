import { View } from 'react-native';

import { atoms as a } from '#/alf';

import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight } from '#/components/icons/Arrow';
import { CalendarDays_Stroke2_Corner0_Rounded as CalendarDays } from '#/components/icons/CalendarDays';
import { Globe_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { Loader } from '#/components/Loader';
import { H1 } from '#/components/Typography';

import { colors } from '#/styles/colors';

export function Icons() {
	return (
		<View style={[a.gap_md]}>
			<H1>Icons</H1>

			<View style={[a.flex_row, a.gap_xl]}>
				<Globe size="xs" fill={colors.text} />
				<Globe size="sm" fill={colors.text} />
				<Globe size="md" fill={colors.text} />
				<Globe size="lg" fill={colors.text} />
				<Globe size="xl" fill={colors.text} />
			</View>

			<View style={[a.flex_row, a.gap_xl]}>
				<ArrowTopRight size="xs" fill={colors.text} />
				<ArrowTopRight size="sm" fill={colors.text} />
				<ArrowTopRight size="md" fill={colors.text} />
				<ArrowTopRight size="lg" fill={colors.text} />
				<ArrowTopRight size="xl" fill={colors.text} />
			</View>

			<View style={[a.flex_row, a.gap_xl]}>
				<CalendarDays size="xs" fill={colors.text} />
				<CalendarDays size="sm" fill={colors.text} />
				<CalendarDays size="md" fill={colors.text} />
				<CalendarDays size="lg" fill={colors.text} />
				<CalendarDays size="xl" fill={colors.text} />
			</View>

			<View style={[a.flex_row, a.gap_xl]}>
				<Loader size="xs" fill={colors.text} />
				<Loader size="sm" fill={colors.text} />
				<Loader size="md" fill={colors.text} />
				<Loader size="lg" fill={colors.text} />
				<Loader size="xl" fill={colors.text} />
			</View>

			<View style={[a.flex_row, a.gap_xl]}>
				<Globe size="xs" gradient="sky" />
				<Globe size="sm" gradient="sky" />
				<Globe size="md" gradient="sky" />
				<Globe size="lg" gradient="sky" />
				<Globe size="xl" gradient="sky" />
			</View>
		</View>
	);
}
