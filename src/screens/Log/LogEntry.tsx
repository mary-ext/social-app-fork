import { useState } from 'react';

import { Collapsible } from '@base-ui/react/collapsible';

import type { ConsoleTransportEntry } from '#/logger/logDump';
import { LogLevel, type Metadata } from '#/logger/types';

import { LOCALE } from '#/locale/intl/locale';

import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as css from './LogEntry.css';

const logTimestamp = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'medium' });

export function LogEntry({ entry }: { entry: ConsoleTransportEntry }) {
	const [open, setOpen] = useState(false);

	const hasMetadata = Object.keys(entry.metadata).length > 0;
	const isProblem = entry.level === LogLevel.Error || entry.level === LogLevel.Warn;

	return (
		<Collapsible.Root open={open} onOpenChange={setOpen} className={css.entry}>
			<Collapsible.Trigger className={css.trigger} disabled={!hasMetadata}>
				{isProblem ? (
					<WarningIcon size="md" fill={colors.negative_500} className={css.icon} />
				) : (
					<CircleInfoIcon size="md" className={css.icon} />
				)}

				{entry.context && (
					<Text size="md_sub" color="textContrastMedium">
						{entry.context}
					</Text>
				)}

				{hasMetadata &&
					(open ? (
						<ChevronTopIcon size="sm" fill={colors.textContrastLow} className={css.chevron} />
					) : (
						<ChevronBottomIcon size="sm" fill={colors.textContrastLow} className={css.chevron} />
					))}

				<Text size="md_sub" color="textContrastMedium" className={css.timestamp}>
					{logTimestamp.format(new Date(entry.timestamp))}
				</Text>

				<Text className={css.message}>{String(entry.message)}</Text>
			</Collapsible.Trigger>

			{hasMetadata && (
				<Collapsible.Panel className={css.panel}>
					<EntryMetadata metadata={entry.metadata} />
				</Collapsible.Panel>
			)}
		</Collapsible.Root>
	);
}

function EntryMetadata({ metadata }: { metadata: Metadata }) {
	return (
		<Text size="sm" className={css.metadata}>
			{JSON.stringify(metadata, null, 2)}
		</Text>
	);
}
