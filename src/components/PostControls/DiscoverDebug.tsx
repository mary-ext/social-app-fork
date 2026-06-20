import { t } from '@lingui/core/macro';

import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';

import * as css from './DiscoverDebug.css';

export function DiscoverDebug({ feedContext }: { feedContext: string | undefined }) {
	const [debugFeedContextEnabled] = useDebugFeedContextEnabled();

	if (!debugFeedContextEnabled || !feedContext) {
		return null;
	}

	return (
		// stopPropagation exempts the click from BlockLink's row navigation (it handles the press on an
		// ancestor); aria-hidden keeps this debug-only affordance out of the accessibility tree
		<div
			aria-hidden
			className={css.label}
			onClick={(e) => {
				e.stopPropagation();
				void navigator.clipboard.writeText(feedContext);
				Toast.show(t`Copied to clipboard`);
			}}
		>
			<Text className={css.text} color="contrast_400" numberOfLines={1}>
				{feedContext}
			</Text>
		</div>
	);
}
