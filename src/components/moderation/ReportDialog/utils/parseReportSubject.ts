import type { AppBskyFeedPost } from '@atcute/bluesky';

import type { ParsedReportSubject, ReportSubject } from '#/components/moderation/ReportDialog/types';

import { parseEmbed } from '#/types/embed';

export function parseReportSubject(subject: ReportSubject): ParsedReportSubject | undefined {
	if (!subject) return;

	if ('convoId' in subject) {
		if ('message' in subject) {
			return {
				type: 'convoMessage',
				...subject,
			};
		}
		return {
			type: 'convo',
			convoId: subject.convoId,
			did: subject.did,
		};
	}

	if (
		subject?.$type === 'app.bsky.actor.defs#profileViewBasic' ||
		subject?.$type === 'app.bsky.actor.defs#profileView' ||
		subject?.$type === 'app.bsky.actor.defs#profileViewDetailed'
	) {
		return {
			type: 'account',
			did: subject.did,
			nsid: 'app.bsky.actor.profile',
		};
	} else if (subject?.$type === 'app.bsky.actor.defs#statusView') {
		if (!subject.uri || !subject.cid) return;
		return {
			type: 'status',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.actor.status',
		};
	} else if (subject?.$type === 'app.bsky.graph.defs#listView') {
		return {
			type: 'list',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.graph.list',
		};
	} else if (subject?.$type === 'app.bsky.feed.defs#generatorView') {
		return {
			type: 'feed',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.feed.generator',
		};
	} else if (subject?.$type === 'app.bsky.graph.defs#starterPackView') {
		return {
			type: 'starterPack',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.graph.starterPack',
		};
	} else if (subject?.$type === 'app.bsky.feed.defs#postView') {
		const record = subject.record as AppBskyFeedPost.Main;
		const embed = parseEmbed(subject.embed);
		return {
			type: 'post',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.feed.post',
			attributes: {
				reply: !!record.reply,
				image: embed.type === 'images' || (embed.type === 'post_with_media' && embed.media.type === 'images'),
				video: embed.type === 'video' || (embed.type === 'post_with_media' && embed.media.type === 'video'),
				link: embed.type === 'link' || (embed.type === 'post_with_media' && embed.media.type === 'link'),
				quote:
					embed.type === 'post' ||
					(embed.type === 'post_with_media' &&
						(embed.view.type === 'post' || embed.view.type === 'post_with_media')),
			},
		};
	}
}
