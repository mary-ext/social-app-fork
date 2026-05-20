/**
 * DO NOT IMPORT THIS DIRECTLY
 *
 * Logger contexts, defined here and used via `Logger.Context.*` static prop.
 */
export enum LogContext {
	Default = 'logger',
	Session = 'session',
	Notifications = 'notifications',
	ConversationAgent = 'conversation-agent',
	DMsAgent = 'dms-agent',
	ReportDialog = 'report-dialog',
	FeedFeedback = 'feed-feedback',
	PostSource = 'post-source',
	Drafts = 'drafts',

	/** METRIC IS FOR INTERNAL USE ONLY, don't create any other loggers using this context */
	Metric = 'metric',
}

export enum LogLevel {
	Debug = 'debug',
	Info = 'info',
	Log = 'log',
	Warn = 'warn',
	Error = 'error',
}

export type Transport = (
	level: LogLevel,
	context: LogContext | undefined,
	message: string | Error,
	metadata: Metadata,
	timestamp: number,
) => void;

export type Metadata = {
	/** Reserved for appending `LogContext` in logging payloads */
	__context__?: undefined;

	/** Reserved for inherited metadata gathered in ambient context */
	__metadata__?: Record<string, unknown>;

	/** Log event category used by transports that support typed records. */
	type?:
		| 'default'
		| 'debug'
		| 'error'
		| 'navigation'
		| 'http'
		| 'info'
		| 'query'
		| 'transaction'
		| 'ui'
		| 'user';

	/** Structured tags for transports that support filtering or grouping. */
	tags?: {
		[key: string]: number | string | boolean | null | undefined;
	};

	/** Any additional structured data for logger transports. */
	[key: string]: Serializable | Error | unknown;
};

export type Serializable =
	| string
	| number
	| boolean
	| null
	| undefined
	| Serializable[]
	| {
			[key: string]: Serializable;
	  };
