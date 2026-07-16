import { createContext } from 'react';

import type { Router } from '../router.ts';
import type { RouteRegistry } from '../routes.ts';
import type { InstanceNode } from '../view-model.ts';

// generated hooks restore the registry type after checking its identity.
// oxlint-disable-next-line typescript/no-explicit-any -- type-erased context
export const RouterContext = createContext<Router<RouteRegistry<any>> | null>(null);

export const ActiveChainContext = createContext<readonly string[]>([]);

export interface CurrentNode {
	readonly node: InstanceNode;
	readonly focused: boolean;
}

export const CurrentNodeContext = createContext<CurrentNode | null>(null);
