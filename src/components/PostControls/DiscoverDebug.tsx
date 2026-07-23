import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';

import * as css from './DiscoverDebug.css';

export function DiscoverDebug({ feedContext }: { feedContext: string | undefined }) {
	const [debugFeedContextEnabled] = useDebugFeedContextEnabled();

	if (!debugFeedContextEnabled || !feedContext) {
		return null;
	}

	return (
		// aria-hidden keeps this debug-only affordance out of the accessibility tree
		<button
			aria-hidden
			className={css.label}
			onClick={() => {
				void navigator.clipboard.writeText(feedContext);
				Toast.show(m['common.share.copiedToast']());
			}}
			type="button"
		>
			<Text className={css.text} color="contrast_400" numberOfLines={1}>
				{feedContext}
			</Text>
		</button>
	);
}
