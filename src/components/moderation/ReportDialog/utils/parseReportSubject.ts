import { unwrapEmbed } from '@atcute/bluesky';

import { getPostRecord } from '#/lib/api/record-views';

import type { ParsedReportSubject, ReportSubject } from '#/components/moderation/ReportDialog/types';

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
		const record = getPostRecord(subject);
		const { media, record: embedRecord } = unwrapEmbed(subject.embed);
		return {
			type: 'post',
			uri: subject.uri,
			cid: subject.cid,
			nsid: 'app.bsky.feed.post',
			attributes: {
				reply: !!record.reply,
				image:
					media?.$type === 'app.bsky.embed.images#view' || media?.$type === 'app.bsky.embed.gallery#view',
				video: media?.$type === 'app.bsky.embed.video#view',
				link: media?.$type === 'app.bsky.embed.external#view',
				quote: embedRecord?.$type === 'app.bsky.embed.record#viewRecord',
			},
		};
	}
}
