import { m } from '#/paraglide/messages';

import type { ParsedReportSubject } from './types';

export function useCopyForSubject(subject: ParsedReportSubject) {
	switch (subject.type) {
		case 'account': {
			return {
				title: m['components.moderation.report.user'](),
				subtitle: m['components.moderation.report.reviewPrompt.user'](),
			};
		}
		case 'status': {
			return {
				title: m['common.liveNow.report'](),
				subtitle: m['components.moderation.report.reviewPrompt.livestream'](),
			};
		}
		case 'post': {
			return {
				title: m['components.moderation.report.post'](),
				subtitle: m['components.moderation.report.reviewPrompt.post'](),
			};
		}
		case 'list': {
			return {
				title: m['components.moderation.report.list'](),
				subtitle: m['components.moderation.report.reviewPrompt.list'](),
			};
		}
		case 'feed': {
			return {
				title: m['components.moderation.report.feed'](),
				subtitle: m['components.moderation.report.reviewPrompt.feed'](),
			};
		}
		case 'starterPack': {
			return {
				title: m['components.moderation.report.starterPack'](),
				subtitle: m['components.moderation.report.reviewPrompt.starterPack'](),
			};
		}
		case 'convo': {
			return {
				title: m['components.moderation.report.conversation'](),
				subtitle: m['components.moderation.report.reviewPrompt.conversation'](),
			};
		}
		case 'convoMessage': {
			switch (subject.view) {
				case 'convo': {
					return {
						title: m['components.moderation.report.conversation'](),
						subtitle: m['components.moderation.report.reviewPrompt.conversation'](),
					};
				}
				case 'message': {
					return {
						title: m['components.moderation.report.message'](),
						subtitle: m['components.moderation.report.reviewPrompt.message'](),
					};
				}
			}
		}
	}
}
