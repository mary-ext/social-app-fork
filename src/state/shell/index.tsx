import { Provider as DrawerOpenProvider } from './drawer-open';
import { Provider as MinimalModeProvider } from './minimal-mode';
import { Provider as TickEveryMinuteProvider } from './tick-every-minute';

export { useSetThemePrefs, useThemePrefs } from './color-mode';
export { useIsDrawerOpen, useSetDrawerOpen } from './drawer-open';
export { useEnableMinimalShellMode, useEnableMinimalShellModeForScreen } from './minimal-mode';
export { useTickEveryMinute } from './tick-every-minute';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<DrawerOpenProvider>
			<MinimalModeProvider>
				<TickEveryMinuteProvider>{children}</TickEveryMinuteProvider>
			</MinimalModeProvider>
		</DrawerOpenProvider>
	);
}
