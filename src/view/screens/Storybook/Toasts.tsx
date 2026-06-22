import { View } from 'react-native';

import { atoms as a } from '#/alf';

import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

const EXAMPLES: { label: string; show: () => void }[] = [
	{ label: 'Default', show: () => Toast.show(`Hey I'm a toast!`) },
	{
		label: 'Success with action',
		show: () =>
			Toast.show(`Action performed`, {
				action: { label: 'Undo', onPress: () => console.log('Undo clicked!') },
				type: 'success',
			}),
	},
	{
		label: 'Error with action',
		show: () =>
			Toast.show(`Something went wrong`, {
				action: { label: 'Retry', onPress: () => console.log('Retry clicked!') },
				type: 'error',
			}),
	},
	{
		label: 'Long message',
		show: () =>
			Toast.show(`This is a longer message to test how the toast handles multiple lines of text content.`),
	},
	{
		label: 'Custom icon',
		show: () => Toast.show(`Now with a custom icon`, { icon: GlobeIcon }),
	},
	{
		label: 'Long duration (6s)',
		show: () => Toast.show(`This toast will disappear after 6 seconds`, { duration: 6e3 }),
	},
	{ label: 'Info', show: () => Toast.show(`I'm providing info!`, { type: 'info' }) },
	{ label: 'Warning', show: () => Toast.show(`This is a warning toast`, { type: 'warning' }) },
	{ label: 'Success', show: () => Toast.show(`Success! Yayyyyyyy :)`, { type: 'success' }) },
	{ label: 'Error', show: () => Toast.show(`This is an error toast :(`, { type: 'error' }) },
];

export function Toasts() {
	return (
		<View style={[a.gap_md]}>
			<Text size="_3xl" weight="bold">
				Toast Examples
			</Text>

			<View style={[a.gap_sm, a.align_start]}>
				{EXAMPLES.map(({ label, show }) => (
					<Button key={label} color="secondary" label={label} onClick={show}>
						<ButtonText>{label}</ButtonText>
					</Button>
				))}
			</View>
		</View>
	);
}
