import { createContext, useContext, useRef } from 'react';

import { useHotkeysContext } from '#/lib/hotkeys';

import { Provider as GlobalDialogsProvider } from '#/components/dialogs/Context';

/** imperative handle a dialog registers so the registry can close it. */
export interface DialogControlRefProps {
	close: () => void;
}

interface IDialogContext {
	/** The currently registered dialogs. */
	activeDialogs: React.MutableRefObject<Map<string, React.MutableRefObject<DialogControlRefProps>>>;
	/** The currently open dialogs, referenced by their IDs, generated from `useId`. */
	openDialogs: React.MutableRefObject<Set<string>>;
}

interface CloseAllDialogsOptions {
	/** Dialog ids to leave open. */
	except?: Iterable<string>;
}

interface IDialogControlContext {
	closeAllDialogs: (opts?: CloseAllDialogsOptions) => boolean;
	setDialogIsOpen: (id: string, isOpen: boolean) => void;
}

const DialogContext = createContext<IDialogContext>({
	activeDialogs: { current: new Map() },
	openDialogs: { current: new Set() },
});
DialogContext.displayName = 'DialogContext';

const DialogControlContext = createContext<IDialogControlContext>({
	closeAllDialogs: () => false,
	setDialogIsOpen: () => {},
});
DialogControlContext.displayName = 'DialogControlContext';

export function useDialogStateContext() {
	return useContext(DialogContext);
}

export function useDialogStateControlContext() {
	return useContext(DialogControlContext);
}

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const { disableScope, enableScope } = useHotkeysContext();

	const activeDialogs = useRef<Map<string, React.MutableRefObject<DialogControlRefProps>>>(new Map());
	const openDialogs = useRef<Set<string>>(new Set());

	const closeAllDialogs = (opts: CloseAllDialogsOptions = {}) => {
		const except = new Set(opts.except);
		// snapshot before closing, since closing mutates openDialogs as each dialog reports back
		const ids = [...openDialogs.current].filter((id) => !except.has(id));

		for (const id of ids) {
			activeDialogs.current.get(id)?.current.close();
		}

		return ids.length > 0;
	};

	const setDialogIsOpen = (id: string, isOpen: boolean) => {
		if (isOpen) {
			openDialogs.current.add(id);
		} else {
			openDialogs.current.delete(id);
		}
		if (openDialogs.current.size > 0) {
			disableScope('global');
		} else {
			enableScope('global');
		}
	};

	const context: IDialogContext = {
		activeDialogs,
		openDialogs,
	};
	const controls = {
		closeAllDialogs,
		setDialogIsOpen,
	};

	return (
		<DialogContext.Provider value={context}>
			<DialogControlContext.Provider value={controls}>
				<GlobalDialogsProvider>{children}</GlobalDialogsProvider>
			</DialogControlContext.Provider>
		</DialogContext.Provider>
	);
}
Provider.displayName = 'DialogsProvider';
