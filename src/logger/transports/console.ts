import format from 'date-fns/format';

import { LogLevel, type Transport } from '#/logger/types';
import { prepareMetadata } from '#/logger/util';

/** Used in dev mode to nicely log to the console */
export const consoleTransport: Transport = (level, context, message, metadata, timestamp) => {
	const hasMetadata = Object.keys(metadata).length;

	const cssColor = {
		[LogLevel.Debug]: 'magenta',
		[LogLevel.Info]: 'dodgerblue',
		[LogLevel.Log]: 'green',
		[LogLevel.Warn]: 'orange',
		[LogLevel.Error]: 'red',
	}[level];

	const timestampStr = format(timestamp, 'HH:mm:ss');
	const contextStr = context ? ` (${context})` : '';
	const messageStr = message ? ` ${message.toString()}` : '';

	const styledPart = `%c${timestampStr}${contextStr}%c${messageStr}`;
	const styles = [`color: ${cssColor}; font-weight: bold`, 'color: inherit'];

	if (hasMetadata) {
		console.groupCollapsed(styledPart, ...styles);
		console.log(prepareMetadata(metadata));
		console.groupEnd();
	} else {
		console.log(styledPart, ...styles);
	}
	if (message instanceof Error) {
		// for stacktrace
		console.error(message);
	}
};
