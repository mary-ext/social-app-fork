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
} from '#/components/web/Dialog/Popup';
export {
	createHandle,
	Description,
	type DialogHandle,
	type OpenChangeDetails,
	Root,
	type RootProps,
	Trigger,
	useDialogHandle,
} from '#/components/web/Dialog/Root';

/** Sticky header slot for a `body`-scroll Popup: `Outer`/`Content`/`Slot`/`TitleText` (like `Layout.Header`). */
export * as Header from '#/components/web/Dialog/Header';
export { List, type ListProps } from '#/components/web/Dialog/List';
