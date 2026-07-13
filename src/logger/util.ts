import { LogLevel, type Metadata, type Serializable } from '#/logger/types';

export const enabledLogLevels: {
	[key in LogLevel]: LogLevel[];
} = {
	[LogLevel.Debug]: [LogLevel.Debug, LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Info]: [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Log]: [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
	[LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
	[LogLevel.Error]: [LogLevel.Error],
};

export function prepareMetadata(metadata: Metadata): Record<string, Serializable> {
	const prepared: Record<string, Serializable> = {};

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
		prepared[key] = value as Serializable;
	}

	return prepared;
}
