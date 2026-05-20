import { View } from 'react-native';
import { type AppBskyGraphDefs } from '@atproto/api';
import { useLingui } from '@lingui/react/macro';

import { atoms as a } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { type DialogControlProps } from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import { QrCode } from '#/components/StarterPack/QrCode';

export function QrCodeDialog({
	starterPack,
	link,
	control,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	link?: string;
	control: DialogControlProps;
}) {
	const { t: l } = useLingui();

	return (
		<Dialog.Outer control={control} nativeOptions={{ preventExpansion: true }}>
			<Dialog.Handle />
			<Dialog.ScrollableInner label={l`Create a QR code for a starter pack`}>
				<View style={[a.flex_1, a.align_center, a.gap_5xl]}>
					{!link ? <Loading /> : <QrCode starterPack={starterPack} link={link} />}
				</View>
				<Dialog.Close />
			</Dialog.ScrollableInner>
		</Dialog.Outer>
	);
}

function Loading() {
	return (
		<View style={[a.align_center, a.justify_center, { minHeight: 400 }]}>
			<Loader size="xl" />
		</View>
	);
}
