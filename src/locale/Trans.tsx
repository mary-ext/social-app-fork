import { Fragment, type ReactNode } from 'react';

import type {
	MessageMarkupAttributes,
	MessageMarkupOptions,
	MessageMarkupSchema,
	MessageMarkupTag,
	MessageMetadata,
	MessagePart,
} from '#/paraglide/runtime';

// derived from @inlang/paraglide-js-react (MIT, (c) Opral US Inc.). renders a paraglide message that
// carries markup: the message file decides which tags appear and where (`{#tag}…{/tag}`), while the
// `markup` prop decides how each tag renders. plain (markup-free) messages render their string
// directly. see messages/en/*.json for the `{#tN}` tags emitted from the old lingui `<Trans>` cases.
//
// the generics derive `inputs` and `markup` from the message's own type (paraglide attaches them as
// phantom MessageMetadata), so a wrong input or an unknown/missing markup tag is a type error.

/** Renders one markup tag instance: its wrapped `children`, plus the tag's `options`/`attributes`. */
type MarkupRenderer<Tag extends MessageMarkupTag = MessageMarkupTag> = (args: {
	attributes: Tag['attributes'];
	children?: ReactNode;
	options: Tag['options'];
}) => ReactNode;

/** A compiled paraglide message function, optionally exposing `.parts()` for markup messages. */
type Message = ((...args: never[]) => string) & {
	parts?: (...args: never[]) => MessagePart[];
};

type MetaOf<M> =
	M extends MessageMetadata<infer Inputs, infer Options, infer Markup>
		? { inputs: Inputs; markup: Markup; options: Options }
		: never;
type InputsOf<M> = MetaOf<M> extends { inputs: infer Inputs } ? Inputs : Record<string, never>;
type MarkupOf<M> =
	MetaOf<M> extends { markup: infer Markup extends MessageMarkupSchema } ? Markup : MessageMarkupSchema;

type InputsProp<Inputs> = keyof Inputs extends never ? { inputs?: Inputs } : { inputs: Inputs };
type MarkupProp<Markup extends MessageMarkupSchema> = keyof Markup extends never
	? { markup?: never }
	: {
			markup: {
				[K in keyof Markup & string]: MarkupRenderer<
					Markup[K] extends MessageMarkupTag ? Markup[K] : MessageMarkupTag
				>;
			};
		};

type TransProps<M> = { message: M } & InputsProp<InputsOf<M>> & MarkupProp<MarkupOf<M>>;

type AnyRenderer = (args: {
	attributes: MessageMarkupAttributes;
	children?: ReactNode;
	options: MessageMarkupOptions;
}) => ReactNode;

interface Frame {
	attributes: MessageMarkupAttributes;
	children: ReactNode[];
	name: string;
	options: MessageMarkupOptions;
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

const renderParts = (parts: MessagePart[], markup: Record<string, AnyRenderer>): ReactNode => {
	const root: ReactNode[] = [];
	const stack: Frame[] = [];
	const append = (node: ReactNode) => {
		const top = stack[stack.length - 1];
		(top ? top.children : root).push(node);
	};
	const render = (frame: Frame): ReactNode => {
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

/**
 * Renders a paraglide message that interleaves React components — the replacement for lingui's `<Trans>` with
 * embedded elements. `inputs` and `markup` are typed against `message`: pass the message's variables as
 * `inputs`, and a renderer per markup tag (keys match the `{#tag}` names, e.g. `t0`) as `markup`.
 *
 * @returns The message rendered with each markup tag mapped through `markup`.
 */
export const Trans = <M extends Message>(props: TransProps<NoInfer<M>> & { message: M }): ReactNode => {
	const { message } = props;
	const inputs = 'inputs' in props ? props.inputs : undefined;
	if (typeof message.parts !== 'function') {
		return message(inputs as never);
	}
	const markup = ('markup' in props ? props.markup : undefined) as Record<string, AnyRenderer> | undefined;
	return renderParts(message.parts(inputs as never), markup ?? {});
};
