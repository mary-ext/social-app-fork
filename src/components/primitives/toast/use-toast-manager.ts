import type { ToastManager, ToastObject } from './manager';
import { useProviderContext } from './shared';

export type UseToastManagerReturnValue<Data extends object = object> = Pick<
	ToastManager<Data>,
	'add' | 'close' | 'promise' | 'update'
> & {
	/** current toasts, newest first. */
	toasts: readonly ToastObject<Data>[];
};

/**
 * @returns the enclosing provider's toasts and methods to manage them
 * @throws if called outside `Provider`
 */
export const useToastManager = <Data extends object = object>(): UseToastManagerReturnValue<Data> => {
	const { manager, toasts } = useProviderContext();
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- callers supply the provider's data type
	const typed = manager as unknown as ToastManager<Data>;
	return {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		toasts: toasts as readonly ToastObject<Data>[],
		add: typed.add,
		close: typed.close,
		promise: typed.promise,
		update: typed.update,
	};
};
