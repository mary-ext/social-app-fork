import { LogLevel, type Transport } from '#/logger/types';
import { prepareMetadata } from '#/logger/util';

// fixed en-US h23 for a stable HH:mm:ss debug stamp, independent of the app locale.
const timeFormat = new Intl.DateTimeFormat('en-US', {
	hour: '2-digit',
	hourCycle: 'h23',
	minute: '2-digit',
	second: '2-digit',
});

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

	const timestampStr = timeFormat.format(timestamp);
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
