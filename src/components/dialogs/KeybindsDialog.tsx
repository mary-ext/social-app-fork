import { Fragment } from 'react';

import * as Dialog from '#/components/Dialog';
import { keybindsDialogHandle } from '#/components/dialogs/handles';
import { type KeybindGroup, KEYBINDS } from '#/components/keybind-catalog';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './KeybindsDialog.css';

const GROUP_TITLES: Record<KeybindGroup, () => string> = {
	general: m['components.dialogs.keybinds.general'],
	posts: m['components.dialogs.keybinds.posts'],
	navigation: m['components.dialogs.keybinds.navigation'],
};

/** lists app keybinds; open with `keybindsDialogHandle`. */
export function KeybindsDialog() {
	return (
		<Dialog.Root handle={keybindsDialogHandle}>
			<Dialog.Popup height="fixed" scroll="body" size="wide">
				<Dialog.Header.Root border>
					<Dialog.Header.Close />
					<Dialog.Header.Title>{m['components.dialogs.keybinds.title']()}</Dialog.Header.Title>
				</Dialog.Header.Root>

				<Dialog.Body>
					{Object.entries(GROUP_TITLES).map(([group, title], idx) => (
						<KeybindSection key={group} group={group} titleText={title()} topBorder={idx !== 0} />
					))}
				</Dialog.Body>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function KeybindSection({
	group,
	titleText,
	topBorder,
}: {
	group: string;
	titleText: string;
	topBorder: boolean;
}) {
	return (
		<section>
			<h3 className={styles.sectionHeader({ topBorder })}>
				<Text color="textContrastMedium" size="md_sub" weight="medium">
					{titleText}
				</Text>
			</h3>

			<dl className={styles.list}>
				{Object.values(KEYBINDS)
					.filter((keybind) => keybind.group === group)
					.map((keybind) => (
						<div key={keybind.keys.join(' ')} className={styles.row}>
							<dt>
								<Text size="md">{keybind.label()}</Text>
							</dt>
							<dd className={styles.keys}>
								{keybind.keys.map((key, idx) => (
									// sequence prefixes distinguish repeated keys
									<Fragment key={keybind.keys.slice(0, idx + 1).join(' ')}>
										{idx > 0 && (
											<Text color="textContrastMedium" size="sm">
												{m['components.dialogs.keybinds.then']()}
											</Text>
										)}
										<kbd className={styles.key}>{key}</kbd>
									</Fragment>
								))}
							</dd>
						</div>
					))}
			</dl>
		</section>
	);
}
