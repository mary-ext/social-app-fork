import { Activity, Suspense, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import type { Router } from '../router.ts';
import type { RouteRegistry } from '../routes.ts';
import type { InstanceNode } from '../view-model.ts';

import { ActiveChainContext, CurrentNodeContext, RouterContext } from './context.ts';

/**
 * renders the current view tree of the router.
 *
 * off-chain branches are frozen using React Activity.
 *
 * @param props.router router instance
 * @returns rendered component tree
 */
export const RouterView = <R extends RouteRegistry<unknown>>({
	router,
}: {
	readonly router: Router<R>;
}): ReactElement => {
	const view = useSyncExternalStore(router.subscribe, () => router.view);

	useLayoutEffect(() => {
		return router.attachView();
	}, [router]);
	useLayoutEffect(() => {
		router.notifyCommit();
	}, [router, view]);

	return (
		<RouterContext value={router}>
			<ActiveChainContext value={view.activePath}>
				<Pool nodes={view.roots} />
			</ActiveChainContext>
		</RouterContext>
	);
};

export const Pool = ({ nodes }: { readonly nodes: readonly InstanceNode[] }): ReactElement => {
	const activePath = useContext(ActiveChainContext);
	return (
		<>
			{nodes.map((node) => (
				<Branch key={node.instanceKey} focused={activePath.includes(node.instanceKey)} node={node} />
			))}
		</>
	);
};

const Branch = ({
	focused,
	node,
}: {
	readonly focused: boolean;
	readonly node: InstanceNode;
}): ReactElement => {
	const resolved = node.node;
	const Component = resolved.node.component;
	const router = useContext(RouterContext);
	const fallback = resolved.node.fallback ?? router?.defaultFallback;

	return (
		<Activity mode={focused ? 'visible' : 'hidden'}>
			<div className="stacker-branch" data-stacker-node={resolved.id} style={{ display: 'contents' }}>
				<CurrentNodeContext value={{ focused, node }}>
					<Suspense fallback={fallback ?? null}>
						<Component />
					</Suspense>
				</CurrentNodeContext>
			</div>
		</Activity>
	);
};
