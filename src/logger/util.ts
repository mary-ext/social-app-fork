import { LogLevel, type Metadata } from '#/logger/types';

export const enabledLogLevels: {
	[key in LogLevel]: LogLevel[];
} = {
	[LogLevel.Debug]: [LogLevel.Debug, LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Info]: [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Log]: [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
	[LogLevel.Error]: [LogLevel.Error],
};

// nothing narrows `Metadata` values to `Serializable`, so leave serialization to the transport
export function prepareMetadata(metadata: Metadata): Record<string, unknown> {
	const prepared: Record<string, unknown> = {};

	for (const key of Object.keys(metadata)) {
		let value = metadata[key];
		if (value instanceof Error) {
			value = value.toString();
		}
		if (
			typeof value === 'object' &&
			value !== null &&
			Object.keys(value).length === 0 &&
			value.constructor === Object
		) {
			continue;
		}
		prepared[key] = value;
	}

	return prepared;
}
