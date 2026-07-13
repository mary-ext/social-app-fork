import { type ConsoleTransportEntry, getEntries } from '#/logger/logDump';

import { LogEntry } from '#/view/com/log/LogEntry';

import { List, type ListRenderItemInfo } from '#/components/List/List';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

const keyExtractor = (entry: ConsoleTransportEntry) => entry.id;

const renderItem = ({ item }: ListRenderItemInfo<ConsoleTransportEntry>) => <LogEntry entry={item} />;

export function LogScreen() {
	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.developer.systemLog']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<List data={getEntries()} keyExtractor={keyExtractor} renderItem={renderItem} />
		</Layout.Screen>
	);
}
