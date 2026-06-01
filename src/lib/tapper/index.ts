/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import type { TextInput } from 'react-native';

import type {
	TapperActiveFacet,
	TapperConfig,
	TapperEvents,
	TapperFacetType,
	TapperNode,
	TapperSelection,
	TapperSnapshot,
} from './types';
import { buildTriggers, detectActiveFacet, nodeToFacet, parseNodesFromText } from './util';

export * from './types';

const ALL_FACETS: TapperFacetType[] = ['emoji', 'mention', 'tag', 'url'];

export class Tapper {
	private enabledFacets: Set<TapperFacetType>;
	private triggers: Map<string, string>;

	// Event emitters

	private listeners = new Map<keyof TapperEvents, Set<(data: any) => void>>();

	// Public state
	text = '';
	selection: TapperSelection = { start: 0, end: 0 };
	nodes: TapperNode[] = [];
	activeFacet: TapperActiveFacet | null = null;

	private inputRef: TextInput | null = null;
	private updating = false;

	// useSyncExternalStore plumbing
	private storeListeners = new Set<() => void>();
	private snapshot: TapperSnapshot;

	constructor(config?: TapperConfig) {
		this.enabledFacets = new Set(config?.facets ?? ALL_FACETS);
		this.triggers = buildTriggers(this.enabledFacets);
		this.snapshot = {
			text: this.text,
			selection: this.selection,
			nodes: this.nodes,
			activeFacet: this.activeFacet,
		};
		if (config?.initialText) {
			this.replaceText(config.initialText);
		}
	}

	setInputRef = (node: TextInput | null) => {
		this.inputRef = node;
	};

	private setInputSelection(start: number, end: number) {
		const el = this.inputRef as any;
		if (!el) return;
		if (typeof el.setSelection === 'function') {
			el.setSelection(start, end);
		} else if (typeof el.setSelectionRange === 'function') {
			el.setSelectionRange(start, end);
		}
	}

	subscribe = (listener: () => void) => {
		this.storeListeners.add(listener);
		return () => this.storeListeners.delete(listener);
	};

	getSnapshot = (): TapperSnapshot => {
		return this.snapshot;
	};

	on = <K extends keyof TapperEvents>(event: K, cb: (data: TapperEvents[K]) => void) => {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set());
		this.listeners.get(event)!.add(cb);
		return () => {
			this.listeners.get(event)?.delete(cb);
		};
	};

	private emit<K extends keyof TapperEvents>(event: K, data: TapperEvents[K]) {
		this.listeners.get(event)?.forEach((cb) => cb(data));
	}

	private notify() {
		this.snapshot = {
			text: this.text,
			selection: this.selection,
			nodes: this.nodes,
			activeFacet: this.activeFacet,
		};
		this.storeListeners.forEach((l) => l());
	}

	private update(newText: string, selection: TapperSelection, commitAll?: boolean) {
		// guard against circular updates when insert() is called during an update cycle
		if (this.updating) return;
		this.updating = true;

		const cursor = selection.end;
		const isRange = selection.start !== selection.end;

		const nodes =
			newText === this.text
				? this.nodes
				: parseNodesFromText(newText, this.enabledFacets, this.nodes, cursor, this.triggers);
		const prev = this.activeFacet;
		const detected = isRange || commitAll ? null : detectActiveFacet(nodes, newText, cursor, this.triggers);

		// When cursor leaves a facet, commit it.
		// On paste (commitAll), commit every uncommitted facet.
		const committedNodes: TapperNode[] = [];
		if (commitAll) {
			for (const node of nodes) {
				if (node.type === 'facet' && !node.committed) {
					node.committed = true;
					committedNodes.push(node);
				}
			}
		} else if (prev && (!detected || detected.type !== prev.type)) {
			for (const node of nodes) {
				if (
					node.type === 'facet' &&
					node.facetType === prev.type &&
					node.start === prev.range.start &&
					node.end === prev.range.end
				) {
					node.committed = true;
					committedNodes.push(node);
					break;
				}
			}
		}

		// Build activeFacet with insert() baked in
		const active: TapperActiveFacet | null = detected ? { ...detected, replace: this.replace } : null;

		this.text = newText;
		this.selection = selection;
		this.nodes = nodes;
		this.activeFacet = active;

		this.updating = false;
		this.notify();

		// Fire events after state is finalized
		const facetChanged =
			active?.type !== prev?.type ||
			active?.value !== prev?.value ||
			active?.range.start !== prev?.range.start ||
			active?.range.end !== prev?.range.end;
		if (facetChanged) {
			this.emit('activeFacet', active);
		}
		for (const node of committedNodes) {
			this.emit('facetCommitted', nodeToFacet(node));
		}
	}

	handleTextChange = (newText: string) => {
		if (newText === this.text) return;

		const diff = newText.length - this.text.length;
		let newEnd = Math.max(this.selection.end + diff, 0);

		// Atomic deletion: backspace into a facet from outside.
		// URLs are excluded — users typically want to edit them character by character.
		let didAtomicDelete = false;
		if (diff === -1 && newEnd < this.selection.end) {
			for (const node of this.nodes) {
				if (
					node.type === 'facet' &&
					node.facetType !== 'url' &&
					node.committed &&
					this.selection.end === node.end
				) {
					const remnant = node.end - node.start - 1;
					newText = newText.slice(0, node.start) + newText.slice(node.start + remnant);
					newEnd = node.start;
					didAtomicDelete = true;
					break;
				}
			}
		}

		// Paste: commit all facets immediately
		const mayBePaste = diff > 1;

		this.update(newText, { start: newEnd, end: newEnd }, mayBePaste);
		if (didAtomicDelete) {
			this.setInputSelection(newEnd, newEnd);
		}
	};

	handleSelectionChange = (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
		const { start, end } = e.nativeEvent.selection;

		if (end > this.text.length) return;

		if (start === this.selection.start && end === this.selection.end) return;

		this.selection = { start, end };

		/*
		 * For selection-only changes (no text change), check if the active facet
		 * would change. If not, skip the full update() cycle — just update the
		 * selection in the snapshot.
		 */
		const isRange = start !== end;
		const detected = isRange ? null : detectActiveFacet(this.nodes, this.text, end, this.triggers);
		const prev = this.activeFacet;
		const facetChanged =
			detected?.type !== prev?.type ||
			detected?.value !== prev?.value ||
			detected?.range.start !== prev?.range.start ||
			detected?.range.end !== prev?.range.end;
		if (!facetChanged) {
			this.snapshot = { ...this.snapshot, selection: this.selection };
			this.storeListeners.forEach((l) => l());
			return;
		}

		this.update(this.text, { start, end });
	};

	replaceText = (text: string, cursor?: number) => {
		const prevActive = this.activeFacet;
		const nodes = parseNodesFromText(text, this.enabledFacets);
		// Mark all non-text nodes as committed (pre-existing facets)
		const newlyCommitted: TapperNode[] = [];
		for (const node of nodes) {
			if (node.type === 'facet') {
				node.committed = true;
				newlyCommitted.push(node);
			}
		}

		const pos = cursor ?? text.length;
		const detected = detectActiveFacet(nodes, text, pos, this.triggers);
		const active: TapperActiveFacet | null = detected ? { ...detected, replace: this.replace } : null;

		this.text = text;
		this.selection = { start: pos, end: pos };
		this.nodes = nodes;
		this.activeFacet = active;

		this.notify();

		if (active !== prevActive) {
			this.emit('activeFacet', active);
		}
		for (const node of newlyCommitted) {
			this.emit('facetCommitted', nodeToFacet(node));
		}
	};

	private replace = (value: string, options?: { noTrailingSpace?: boolean }) => {
		if (!this.activeFacet) return;

		const replacement = value + (options?.noTrailingSpace ? '' : ' ');
		const newText =
			this.text.slice(0, this.activeFacet.range.start) +
			replacement +
			this.text.slice(this.activeFacet.range.end);
		const newEnd = this.activeFacet.range.start + replacement.length;

		if (this.activeFacet) {
			this.activeFacet.raw = value;
			this.activeFacet.value = value;
			this.activeFacet.range = {
				start: this.activeFacet.range.start,
				end: this.activeFacet.range.start + value.length,
			};
			this.emit('afterInsert', this.activeFacet);
		}

		this.update(newText, { start: newEnd, end: newEnd });
		this.setInputSelection(newEnd, newEnd);
	};

	insert = (text: string) => {
		const pos = this.selection.end;
		const newText = this.text.slice(0, pos) + text + this.text.slice(pos);
		const newEnd = pos + text.length;
		this.update(newText, { start: newEnd, end: newEnd });
		this.setInputSelection(newEnd, newEnd);
	};
}

export function useTapper(config: TapperConfig) {
	const [store] = useState(() => new Tapper(config));
	const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
	const [input, setInput] = useState<TextInput | null>(null);
	const inputRef = useRef<{ focus(): void }>(null);

	const handleSetInput = useCallback(
		(node: TextInput | null) => {
			inputRef.current = node;
			store.setInputRef(node);
			setInput(node);
		},
		[store],
	);
	const focus = useCallback(() => input?.focus(), [input]);
	const blur = useCallback(() => input?.blur(), [input]);

	return {
		state,
		on: store.on,
		insert: store.insert,
		input: {
			element: input,
			focus,
			blur,
		},
		inputProps: {
			ref: handleSetInput,
			value: state.text,
			onChangeText: store.handleTextChange,
			onSelectionChange: store.handleSelectionChange,
		},
	};
}
