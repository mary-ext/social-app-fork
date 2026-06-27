import { Fragment, type ReactNode } from 'react';

// derived from @inlang/paraglide-js-react (MIT, (c) Opral US Inc.). renders a paraglide message that
// carries markup: the message file decides which tags appear and where (`{#tag}…{/tag}`), while the
// `markup` prop decides how each tag renders. plain (markup-free) messages render their string
// directly. see messages/en/*.json for the `{#tN}` tags emitted from the old lingui `<Trans>` cases.

interface MarkupArgs {
	children?: ReactNode;
	options: Record<string, unknown>;
	attributes: Record<string, unknown>;
}

/** Renders one markup tag. Receives the tag's wrapped `children`, plus its `options`/`attributes`. */
type MarkupRenderer = (args: MarkupArgs) => ReactNode;

type MessagePart =
	| { type: 'markup-end'; name: string }
	| {
			type: 'markup-standalone';
			name: string;
			options: Record<string, unknown>;
			attributes: Record<string, unknown>;
	  }
	| {
			type: 'markup-start';
			name: string;
			options: Record<string, unknown>;
			attributes: Record<string, unknown>;
	  }
	| { type: 'text'; value: string };

/** A compiled paraglide message function, optionally exposing `.parts()` for markup messages. */
type Message = ((inputs?: Record<string, unknown>, options?: { locale?: string }) => string) & {
	parts?: (inputs?: Record<string, unknown>, options?: { locale?: string }) => MessagePart[];
};

interface Frame {
	attributes: Record<string, unknown>;
	children: ReactNode[];
	name: string;
	options: Record<string, unknown>;
}

const toChildren = (nodes: ReactNode[]): ReactNode => {
	if (nodes.length === 0) {
		return null;
	}
	if (nodes.length === 1) {
		return nodes[0] ?? null;
	}
	return nodes.map((node, i) => <Fragment key={i}>{node}</Fragment>);
};

const renderParts = (parts: MessagePart[], markup: Record<string, MarkupRenderer>): ReactNode => {
	const root: ReactNode[] = [];
	const stack: Frame[] = [];
	const append = (node: ReactNode) => {
		const top = stack[stack.length - 1];
		(top ? top.children : root).push(node);
	};
	const render = (frame: Omit<Frame, 'children'> & { children: ReactNode[] }): ReactNode => {
		const renderer = markup[frame.name];
		const children = toChildren(frame.children);
		if (!renderer) {
			return children;
		}
		return renderer({
			attributes: frame.attributes,
			children: children ?? undefined,
			options: frame.options,
		});
	};

	for (const part of parts) {
		switch (part.type) {
			case 'markup-end': {
				const frame = stack.pop();
				if (!frame || frame.name !== part.name) {
					throw new Error(`mismatched markup: ${part.name}`);
				}
				append(render(frame));
				break;
			}
			case 'markup-standalone': {
				append(render({ attributes: part.attributes, children: [], name: part.name, options: part.options }));
				break;
			}
			case 'markup-start': {
				stack.push({ attributes: part.attributes, children: [], name: part.name, options: part.options });
				break;
			}
			case 'text': {
				append(part.value);
				break;
			}
		}
	}
	if (stack.length > 0) {
		throw new Error(`unclosed markup: ${stack[stack.length - 1]?.name}`);
	}
	return toChildren(root);
};

interface TransProps {
	/** A paraglide message function from `#/paraglide/messages`. */
	message: Message;
	/** Message variables (the message's declared inputs). */
	inputs?: Record<string, unknown>;
	/** A renderer per markup tag in the message (keys match the `{#tag}` names, e.g. `t0`). */
	markup?: Record<string, MarkupRenderer>;
}

/**
 * Renders a paraglide message that interleaves React components, the replacement for lingui's `<Trans>` with
 * embedded elements.
 *
 * @returns The message rendered with each markup tag mapped through `markup`.
 */
export const Trans = ({ inputs, markup, message }: TransProps): ReactNode => {
	const i = inputs ?? {};
	if (typeof message.parts !== 'function') {
		return message(i);
	}
	return renderParts(message.parts(i), markup ?? {});
};
