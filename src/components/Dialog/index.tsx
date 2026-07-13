export {
	Actions,
	Body,
	Card,
	Close,
	Divider,
	Footer,
	Popup,
	Title,
	TitleRow,
	Viewport,
} from '#/components/Dialog/Popup';
export {
	createHandle,
	type DialogHandle,
	type OpenChangeDetails,
	Root,
	type RootProps,
	Trigger,
	useDialogHandle,
} from '#/components/Dialog/Root';

/** Sticky header slot for a `body`-scroll Popup: `Outer`/`Content`/`Slot`/`TitleText` (like `Layout.Header`). */
export * as Header from '#/components/Dialog/Header';
export { List, type ListProps } from '#/components/Dialog/List';
