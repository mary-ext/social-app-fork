import type { ActorIdentifier } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { makeRecordUri } from '#/lib/at-uri';
import { countLines } from '#/lib/code/lines';
import { profileTarget } from '#/lib/routes/targets';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useTangledStringQuery } from '#/state/queries/tangled-string';

import * as Dialog from '#/components/Dialog';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { ExternalLink, Link } from '#/components/web/Link';
import * as Skele from '#/components/web/Skeleton';

import CodeBrackets from '#/icons/central/CodeBrackets_round_outlined_radius1_stroke2.svg';
import ExpandIcon from '#/icons/central/Expand45_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { CodeBlock, CodeBlockSkeleton } from './CodeBlock';
import type { TangledStringTarget } from './detect';
import { FullFileDialog } from './FullFileDialog';
import * as css from './index.css';
import { previewRows } from './metrics';

const SKELETON_WIDTH_CYCLE = ['55%', '80%', '40%', '70%', '30%', '65%', '85%', '45%', '60%', '35%'];
const SKELETON_WIDTHS = Array.from(
	{ length: Math.ceil(previewRows / SKELETON_WIDTH_CYCLE.length) },
	() => SKELETON_WIDTH_CYCLE,
)
	.flat()
	.slice(0, previewRows);

type TangledStringEmbedProps = {
	className?: string;
	onOpen?: () => void;
	target: TangledStringTarget;
};

export function TangledStringEmbed({ target, className, onOpen }: TangledStringEmbedProps) {
	const dialog = Dialog.useDialogHandle();

	const uri = makeRecordUri(target.actor, 'sh.tangled.string', target.rkey);
	const { data: record, error } = useTangledStringQuery({ uri });

	const filename = record?.filename;
	const openLabel =
		filename !== undefined
			? m['components.post.tangledString.a11y.open']({ filename })
			: m['components.post.tangledString.a11y.openSnippet']();
	const viewFileLabel = m['components.post.tangledString.viewFile']();

	return (
		<div className={clsx(css.card, className)}>
			<div className={css.header}>
				<CodeBrackets aria-hidden className={css.headerIcon} />

				<ExternalLink className={css.filenameLink} href={target.href} label={openLabel} onPress={onOpen}>
					{record ? (
						<Text numberOfLines={1} size="md_sub" weight="semiBold">
							{record.filename}
						</Text>
					) : !error ? (
						<Skele.Text size="md_sub" width={120} />
					) : null}
				</ExternalLink>

				<ExternalLink
					className={css.domainLink}
					href={target.href}
					label={m['components.post.tangledString.a11y.openSnippet']()}
					onPress={onOpen}
					tabIndex={-1}
				>
					<Text color="textContrastMedium" size="xs">
						tangled.org
					</Text>
				</ExternalLink>
			</div>

			<div className={css.codeArea}>
				{record ? (
					<CodeBlock
						contents={record.contents}
						filename={record.filename}
						overflow="clip"
						rows={previewRows}
					/>
				) : error ? (
					<div className={css.message}>
						<Text color="textContrastMedium" size="md_sub" weight="medium">
							{m['components.post.tangledString.error']()}
						</Text>
					</div>
				) : (
					<CodeBlockSkeleton widths={SKELETON_WIDTHS} />
				)}
			</div>

			<div className={css.footer}>
				<Byline actor={target.actor} />

				<div className={css.footerSection}>
					{record ? (
						<Text color="textContrastMedium" size="xs">
							{m['components.post.tangledString.lineCount']({
								lineCount: countLines(record.contents),
							})}
						</Text>
					) : null}

					<Button
						className={css.action}
						color="secondary"
						disabled={record === undefined}
						label={viewFileLabel}
						onClick={() => dialog.open(null)}
						size="tiny"
						variant="ghost"
					>
						<ButtonText>{viewFileLabel}</ButtonText>
						<ButtonIcon icon={ExpandIcon} />
					</Button>
				</div>
			</div>

			{record !== undefined ? (
				<FullFileDialog
					contents={record.contents}
					filename={record.filename}
					handle={dialog}
					onOpen={onOpen}
					uri={target.href}
				/>
			) : null}
		</div>
	);
}

const Byline = ({ actor }: { actor: ActorIdentifier }) => {
	const { data: did } = useResolveDidQuery(actor);
	const { data: author } = useProfileQuery({ batch: true, did });

	if (!did || !author) {
		return (
			<Skele.Row align="center" gap="sm">
				<Skele.Circle size={20} />
				<Skele.Text size="sm" width={100} />
			</Skele.Row>
		);
	}

	return (
		<ProfileHoverCard actor={did}>
			<Link className={css.byline} label={author.handle} to={profileTarget(author.did)}>
				<UserAvatar avatar={author.avatar} size={20} type="user" />
				<Text
					className={css.bylineHandle}
					color="textContrastMedium"
					numberOfLines={1}
					size="sm"
					weight="medium"
				>
					{author.handle}
				</Text>
			</Link>
		</ProfileHoverCard>
	);
};
