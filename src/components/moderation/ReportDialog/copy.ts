import { m } from '#/paraglide/messages';

import type { ParsedReportSubject } from './types';

export function useCopyForSubject(subject: ParsedReportSubject) {
	switch (subject.type) {
		case 'account': {
			return {
				title: m['components.moderation.report.user'](),
				subtitle: m['components.moderation.prompt.reviewUser'](),
			};
		}
		case 'status': {
			return {
				title: m['common.action.reportLivestream'](),
				subtitle: m['components.moderation.prompt.reviewLivestream'](),
			};
		}
		case 'post': {
			return {
				title: m['components.moderation.report.post'](),
				subtitle: m['components.moderation.prompt.reviewPost'](),
			};
		}
		case 'list': {
			return {
				title: m['components.moderation.report.list'](),
				subtitle: m['components.moderation.prompt.reviewList'](),
			};
		}
		case 'feed': {
			return {
				title: m['components.moderation.report.feed'](),
				subtitle: m['components.moderation.prompt.reviewFeed'](),
			};
		}
		case 'starterPack': {
			return {
				title: m['components.moderation.report.starterPack'](),
				subtitle: m['components.moderation.prompt.reviewStarterPack'](),
			};
		}
		case 'convo': {
			return {
				title: m['components.moderation.report.conversation'](),
				subtitle: m['components.moderation.prompt.reviewConversation'](),
			};
		}
		case 'convoMessage': {
			switch (subject.view) {
				case 'convo': {
					return {
						title: m['components.moderation.report.conversation'](),
						subtitle: m['components.moderation.prompt.reviewConversation'](),
					};
				}
				case 'message': {
					return {
						title: m['components.moderation.report.message'](),
						subtitle: m['components.moderation.prompt.reviewMessage'](),
					};
				}
			}
		}
	}
}
