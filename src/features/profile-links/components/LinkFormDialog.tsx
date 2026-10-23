import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';

import { m } from '#/paraglide/messages';

import type { ProfileLink } from '../types';
import { LinkForm } from './LinkForm';

/** link index to edit, or null to add a link. */
export type LinkFormPayload = { index: number | null };

/**
 * adds, edits, or removes a link locally, then closes and calls onChange.
 *
 * @param props dialog handle, current links, and change callback
 */
export function LinkFormDialog({
	handle,
	links,
	onChange,
}: {
	handle: Dialog.DialogHandle<LinkFormPayload>;
	links: ProfileLink[];
	onChange: (links: ProfileLink[]) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: LinkFormPayload | undefined }) => {
				if (!payload) {
					return null;
				}
				return (
					<Dialog.Popup size="narrow">
						<Stack gap="xl">
							<Stack gap="xs">
								<Dialog.TitleRow>
									<Dialog.Title>
										{payload.index === null
											? m['features.profileLinks.form.addTitle']()
											: m['features.profileLinks.form.editTitle']()}
									</Dialog.Title>
									<Dialog.Close />
								</Dialog.TitleRow>
							</Stack>

							<LinkForm
								index={payload.index}
								links={links}
								onDone={(next) => {
									handle.close();
									onChange(next);
								}}
							/>
						</Stack>
					</Dialog.Popup>
				);
			}}
		</Dialog.Root>
	);
}
