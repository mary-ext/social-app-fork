import * as Dialog from '#/components/Dialog';
import { ExternalInlineLinkText } from '#/components/web/Link';

import ArrowTopRightIcon from '#/icons/central/ArrowUpRight_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { CodeBlock } from './CodeBlock';
import * as css from './FullFileDialog.css';

type FullFileDialogProps = {
	contents: string;
	filename: string;
	handle: Dialog.DialogHandle;
	onOpen?: () => void;
	uri: string;
};

export function FullFileDialog({ contents, filename, handle, onOpen, uri }: FullFileDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup fullHeight scroll="body" size="xwide">
				<DialogInner contents={contents} filename={filename} onOpen={onOpen} uri={uri} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ contents, filename, onOpen, uri }: Omit<FullFileDialogProps, 'handle'>) {
	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot />
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{filename}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<span className={css.close}>
						<Dialog.Close />
					</span>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

			<Dialog.Body className={css.body}>
				<CodeBlock contents={contents} filename={filename} overflow="scroll" />
			</Dialog.Body>

			<Dialog.Footer>
				<Dialog.Actions>
					<ExternalInlineLinkText
						className={css.link}
						href={uri}
						label={m['components.post.tangledString.a11y.open']({ filename })}
						onPress={onOpen}
						size="sm"
					>
						tangled.org
						<ArrowTopRightIcon aria-hidden className={css.linkIcon} />
					</ExternalInlineLinkText>
				</Dialog.Actions>
			</Dialog.Footer>
		</>
	);
}
