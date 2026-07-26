import { Provider as AppearanceProvider } from './appearance';
import { Provider as DrawerOpenProvider } from './drawer-open';

export { useAppearance } from './appearance';
export { useIsDrawerOpen, useSetDrawerOpen } from './drawer-open';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<AppearanceProvider>
			<DrawerOpenProvider>{children}</DrawerOpenProvider>
		</AppearanceProvider>
	);
}
