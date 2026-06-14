import { useCallback } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { type EmbedPlayerSource, embedPlayerSources, externalEmbedLabels } from '#/lib/strings/embed-player';

import { useSetExternalEmbedPref } from '#/state/preferences';

import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import * as styles from './EmbedConsent.css';

export function EmbedConsentDialog({
	handle,
	source,
	onAccept,
}: {
	handle: ReturnType<typeof Dialog.createHandle>;
	source: EmbedPlayerSource;
	onAccept: () => void;
}) {
	const { t: l } = useLingui();
	const setExternalEmbedPref = useSetExternalEmbedPref();

	const onShowAllPress = useCallback(() => {
		for (const key of embedPlayerSources) {
			setExternalEmbedPref(key, 'show');
		}
		onAccept();
		handle.close();
	}, [handle, onAccept, setExternalEmbedPref]);

	const onShowPress = useCallback(() => {
		setExternalEmbedPref(source, 'show');
		onAccept();
		handle.close();
	}, [handle, onAccept, setExternalEmbedPref, source]);

	const onHidePress = useCallback(() => {
		setExternalEmbedPref(source, 'hide');
		handle.close();
	}, [handle, setExternalEmbedPref, source]);

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow" label={l`External Media`}>
				<Text size="_2xl" weight="bold">
					<Trans>External Media</Trans>
				</Text>

				<div className={styles.body}>
					<Text size="md">
						<Trans>
							This content is hosted by {externalEmbedLabels[source]}. Do you want to enable external media?
						</Trans>
					</Text>

					<Admonition type="info">
						<Trans>
							External media may allow websites to collect information about you and your device. No
							information is sent or requested until you press the "play" button.
						</Trans>
					</Admonition>
				</div>

				<div className={styles.actions}>
					<Button label={l`Enable external media`} onClick={onShowAllPress} color="primary" size="large">
						<ButtonText>
							<Trans>Enable external media</Trans>
						</ButtonText>
					</Button>
					<Button label={l`Enable this source only`} onClick={onShowPress} color="secondary" size="large">
						<ButtonText>
							<Trans>Enable {externalEmbedLabels[source]} only</Trans>
						</ButtonText>
					</Button>
					<Button label={l`No thanks`} onClick={onHidePress} variant="ghost" color="secondary" size="large">
						<ButtonText>
							<Trans>No thanks</Trans>
						</ButtonText>
					</Button>
				</div>

				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
