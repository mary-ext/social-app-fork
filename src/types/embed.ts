import {
	type AppBskyEmbedExternal,
	type AppBskyEmbedImages,
	type AppBskyEmbedRecord,
	type AppBskyEmbedVideo,
	type AppBskyFeedDefs,
	type AppBskyGraphDefs,
	type AppBskyLabelerDefs,
} from '@atcute/bluesky';

export type Embed =
	| {
			type: 'post';
			view: AppBskyEmbedRecord.ViewRecord;
	  }
	| {
			type: 'post_not_found';
			view: AppBskyEmbedRecord.ViewNotFound;
	  }
	| {
			type: 'post_blocked';
			view: AppBskyEmbedRecord.ViewBlocked;
	  }
	| {
			type: 'post_detached';
			view: AppBskyEmbedRecord.ViewDetached;
	  }
	| {
			type: 'feed';
			view: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'list';
			view: AppBskyGraphDefs.ListView;
	  }
	| {
			type: 'labeler';
			view: AppBskyLabelerDefs.LabelerView;
	  }
	| {
			type: 'starter_pack';
			view: AppBskyGraphDefs.StarterPackViewBasic;
	  }
	| {
			type: 'images';
			view: AppBskyEmbedImages.View;
	  }
	| {
			type: 'link';
			view: AppBskyEmbedExternal.View;
	  }
	| {
			type: 'video';
			view: AppBskyEmbedVideo.View;
	  }
	| {
			type: 'post_with_media';
			view: Embed;
			media: Embed;
	  }
	| {
			type: 'unknown';
			view: null;
	  };

export type EmbedType<T extends Embed['type']> = Extract<Embed, { type: T }>;

export function parseEmbedRecordView({ record }: AppBskyEmbedRecord.View): Embed {
	switch (record.$type) {
		case 'app.bsky.embed.record#viewRecord':
			return { type: 'post', view: record };
		case 'app.bsky.embed.record#viewNotFound':
			return { type: 'post_not_found', view: record };
		case 'app.bsky.embed.record#viewBlocked':
			return { type: 'post_blocked', view: record };
		case 'app.bsky.embed.record#viewDetached':
			return { type: 'post_detached', view: record };
		case 'app.bsky.feed.defs#generatorView':
			return { type: 'feed', view: record };
		case 'app.bsky.graph.defs#listView':
			return { type: 'list', view: record };
		case 'app.bsky.labeler.defs#labelerView':
			return { type: 'labeler', view: record };
		case 'app.bsky.graph.defs#starterPackViewBasic':
			return { type: 'starter_pack', view: record };
		default:
			return { type: 'unknown', view: null };
	}
}

export function parseEmbed(embed: AppBskyFeedDefs.PostView['embed']): Embed {
	switch (embed?.$type) {
		case 'app.bsky.embed.images#view':
			return { type: 'images', view: embed };
		case 'app.bsky.embed.external#view':
			return { type: 'link', view: embed };
		case 'app.bsky.embed.video#view':
			return { type: 'video', view: embed };
		case 'app.bsky.embed.record#view':
			return parseEmbedRecordView(embed);
		case 'app.bsky.embed.recordWithMedia#view':
			return {
				type: 'post_with_media',
				view: parseEmbedRecordView(embed.record),
				media: parseEmbed(embed.media),
			};
		default:
			return { type: 'unknown', view: null };
	}
}
