export type Span = { scope?: string; value: string };

export type Line = Span[];

const LINE_BREAK = /\r\n?|\n/;

/**
 * splits source on LF, CRLF, or CR.
 *
 * @param source text to split
 * @param limit maximum lines
 * @returns one entry per line
 */
export const splitLines = (source: string, limit?: number): string[] => source.split(LINE_BREAK, limit);

/**
 * counts LF, CRLF, and CR-delimited lines.
 *
 * @param source text to count
 * @returns at least one
 */
export const countLines = (source: string): number => {
	let count = 1;
	for (let index = 0; index < source.length; index++) {
		const char = source[index];
		if (char === '\n') {
			count++;
		} else if (char === '\r') {
			count++;
			if (source[index + 1] === '\n') {
				index++;
			}
		}
	}
	return count;
};

/**
 * takes leading source lines.
 *
 * @param source text to truncate
 * @param rows lines to keep
 * @returns lines joined with LF
 */
export const takeLines = (source: string, rows: number): string => splitLines(source, rows).join('\n');

/**
 * converts source text to plain lines.
 *
 * @param source text to convert
 * @returns unhighlighted lines
 */
export const plainLines = (source: string): Line[] =>
	splitLines(source).map((line) => (line ? [{ value: line }] : []));
