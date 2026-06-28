import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { getEntries } from '#/logger/logDump';
import { LogLevel } from '#/logger/types';

import { LOCALE } from '#/locale/intl/locale';

import { atoms as a, useTheme } from '#/alf';

import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

// debug log entries are absolute moments, not "5m ago" durations — show the wall-clock date and time.
const logTimestamp = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'medium' });

export function LogScreen({}: NativeStackScreenProps<CommonNavigatorParams, 'Log'>) {
	const t = useTheme();
	const [expanded, setExpanded] = useState<string[]>([]);

	const toggler = (id: string) => () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		if (expanded.includes(id)) {
			setExpanded(expanded.filter((v) => v !== id));
		} else {
			setExpanded([...expanded, id]);
		}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.developer.systemLog']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				{getEntries()
					.slice(0)
					.map((entry) => {
						return (
							<View key={`entry-${entry.id}`}>
								<Pressable
									style={[
										a.flex_row,
										a.align_center,
										a.py_md,
										a.px_sm,
										a.border_b,
										t.atoms.border_contrast_low,
										t.atoms.bg,
										a.gap_sm,
									]}
									onPress={toggler(entry.id)}
									accessibilityLabel={m['screens.log.entry.view']()}
									accessibilityHint={m['screens.log.entry.openDetails']()}
								>
									{entry.level === LogLevel.Warn || entry.level === LogLevel.Error ? (
										<WarningIcon size="sm" fill={colors.negative_500} />
									) : (
										<CircleInfoIcon size="sm" />
									)}
									<View style={[a.flex_1, a.flex_row, a.justify_start, a.align_center, a.gap_sm]}>
										{entry.context && (
											<Text style={[t.atoms.text_contrast_medium]}>({String(entry.context)})</Text>
										)}
										<Text>{String(entry.message)}</Text>
									</View>
									{entry.metadata &&
										Object.keys(entry.metadata).length > 0 &&
										(expanded.includes(entry.id) ? (
											<ChevronTopIcon size="sm" fill={colors.textContrastLow} />
										) : (
											<ChevronBottomIcon size="sm" fill={colors.textContrastLow} />
										))}
									<Text style={[{ minWidth: 40 }, t.atoms.text_contrast_medium]}>
										{logTimestamp.format(new Date(entry.timestamp))}
									</Text>
								</Pressable>
								{expanded.includes(entry.id) && (
									<View
										style={[
											t.atoms.bg_contrast_25,
											a.rounded_xs,
											a.p_sm,
											a.border_b,
											t.atoms.border_contrast_low,
										]}
									>
										<View style={[a.px_sm, a.py_xs]}>
											<Text style={[a.leading_snug, { fontFamily: 'monospace' }]}>
												{JSON.stringify(entry.metadata, null, 2)}
											</Text>
										</View>
									</View>
								)}
							</View>
						);
					})}
			</Layout.Content>
		</Layout.Screen>
	);
}
