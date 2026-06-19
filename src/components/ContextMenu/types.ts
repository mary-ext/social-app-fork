import type { AccessibilityRole } from 'react-native';

import type * as Dialog from '#/components/Dialog';
import type { RadixPassThroughTriggerProps } from '#/components/Menu/types';

export type { GroupProps, ItemIconProps, ItemTextProps } from '#/components/Menu/types';

export type TriggerChildProps = {
	control: Dialog.DialogOuterProps['control'];
	state: {
		hovered: false;
		focused: false;
		pressed: false;
	};
	props: RadixPassThroughTriggerProps & {
		onPress: () => void;
		onFocus: () => void;
		onBlur: () => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
		accessibilityHint?: string;
		accessibilityLabel: string;
		accessibilityRole: AccessibilityRole;
	};
};
