import type { FollowIssue } from '#/lib/follow-cleanup';

import { m } from '#/paraglide/messages';

export const FOLLOW_ISSUE_LABELS: Record<FollowIssue, () => string> = {
	blockedBy: m['components.followCleanupDialog.issue.blockedBy'],
	blocking: m['components.followCleanupDialog.issue.blocking'],
	deactivated: m['components.followCleanupDialog.issue.deactivated'],
	hidden: m['components.followCleanupDialog.issue.hidden'],
	self: m['components.followCleanupDialog.issue.self'],
	suspended: m['components.followCleanupDialog.issue.suspended'],
	unavailable: m['components.followCleanupDialog.issue.unavailable'],
};
