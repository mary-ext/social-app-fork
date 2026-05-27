// scaffold: pass-through <View> for the iOS-only scroll forwarder. inline at the single caller
// (src/view/screens/Profile.tsx) once Profile drops the ExpoScrollForwarderView wrapper.

import { View, type ViewProps } from 'react-native';

export function ExpoScrollForwarderView(props: ViewProps & { scrollViewTag?: number | null }) {
	return <View {...props} />;
}
