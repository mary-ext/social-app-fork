import { Provider as DrawerOpenProvider } from './drawer-open';
import { Provider as TickEveryMinuteProvider } from './tick-every-minute';

export { useSetThemePrefs, useThemePrefs } from './color-mode';
export { useIsDrawerOpen, useSetDrawerOpen } from './drawer-open';
export { useTickEveryMinute } from './tick-every-minute';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<DrawerOpenProvider>
			<TickEveryMinuteProvider>{children}</TickEveryMinuteProvider>
		</DrawerOpenProvider>
	);
}
