import { Provider as AppearanceProvider } from './appearance';
import { Provider as DrawerOpenProvider } from './drawer-open';
import { Provider as TickEveryMinuteProvider } from './tick-every-minute';

export { useAppearance } from './appearance';
export { useIsDrawerOpen, useSetDrawerOpen } from './drawer-open';
export { useTickEveryMinute } from './tick-every-minute';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<AppearanceProvider>
			<DrawerOpenProvider>
				<TickEveryMinuteProvider>{children}</TickEveryMinuteProvider>
			</DrawerOpenProvider>
		</AppearanceProvider>
	);
}
