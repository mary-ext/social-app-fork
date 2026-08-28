import { Fragment } from 'react';

import { plainLines, takeLines } from '#/lib/code/lines';

import { useCodeHighlightQuery } from '#/state/queries/code-highlight';

import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import { scopeClasses } from '#/styles/code.css';

import * as css from './CodeBlock.css';
import { codeTextSize } from './metrics';

type CodeBlockProps = {
	contents: string;
	filename: string;
	overflow: 'clip' | 'scroll';
	rows?: number;
};

const OVERFLOW_CLASSES = {
	clip: { grid: css.gridClip, gutter: css.gutter, row: css.rowClip },
	scroll: { grid: css.gridScroll, gutter: css.gutterScroll, row: css.row },
};

function scopeClass(scope: string | undefined): string | undefined {
	if (scope === undefined) {
		return undefined;
	}

	// use the base scope for unstyled sub-scopes.
	const dot = scope.indexOf('.');
	return scopeClasses[scope] ?? (dot > 0 ? scopeClasses[scope.slice(0, dot)] : undefined);
}

export function CodeBlock({ contents, filename, overflow, rows }: CodeBlockProps) {
	// highlight only the visible preview.
	const source = rows !== undefined ? takeLines(contents, rows) : contents;

	const { data: highlighted } = useCodeHighlightQuery({ contents: source, filename });
	const lines = highlighted ?? plainLines(source);

	const classes = OVERFLOW_CLASSES[overflow];

	return (
		<pre className={css.block}>
			<code className={classes.grid}>
				{lines.map((line, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- positional
					<Fragment key={index}>
						<Text aria-hidden className={classes.gutter}>
							{index + 1}
						</Text>
						<span className={classes.row}>
							{line.map((span, spanIndex) => {
								const scope = scopeClass(span.scope);
								return scope ? (
									// oxlint-disable-next-line react/no-array-index-key -- positional
									<span className={scope} key={spanIndex}>
										{span.value}
									</span>
								) : (
									// oxlint-disable-next-line react/no-array-index-key -- positional
									<Fragment key={spanIndex}>{span.value}</Fragment>
								);
							})}
						</span>
					</Fragment>
				))}
			</code>
		</pre>
	);
}

export function CodeBlockSkeleton({ widths }: { widths: string[] }) {
	return (
		<pre aria-hidden className={css.block}>
			<div className={css.gridClip}>
				{widths.map((width, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- positional
					<Fragment key={index}>
						<div className={css.gutterSkeleton}>
							<Skele.Text size={codeTextSize} width="100%" />
						</div>
						<div className={css.rowClip}>
							<Skele.Text size={codeTextSize} width={width} />
						</div>
					</Fragment>
				))}
			</div>
		</pre>
	);
}
