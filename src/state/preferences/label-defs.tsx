import { createContext, useContext } from 'react';
import { type AppBskyLabelerDefs } from '@atcute/bluesky';
import { type InterpretedLabelMapping } from '@atcute/bluesky-moderation';

import { useLabelDefinitionsQuery } from '../queries/preferences';

interface StateContext {
	labelDefs: Record<string, InterpretedLabelMapping>;
	labelers: AppBskyLabelerDefs.LabelerViewDetailed[];
}

const stateContext = createContext<StateContext>({
	labelDefs: {},
	labelers: [],
});
stateContext.displayName = 'LabelDefsStateContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const state = useLabelDefinitionsQuery();
	return <stateContext.Provider value={state}>{children}</stateContext.Provider>;
}

export function useLabelDefinitions() {
	return useContext(stateContext);
}
