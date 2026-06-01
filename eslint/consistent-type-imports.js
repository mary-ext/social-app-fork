'use strict';

/**
 * one rule owning the type-import convention:
 *
 * - all specifiers used only as types -> `import type { A, B } from 'm'`
 * - mix of value and type-only specifiers -> `import { Value, type A } from 'm'`
 * - never two statements for the same module -> merged into one
 *
 * type-only-ness is read from the typescript-eslint scope analysis (`reference.isTypeReference`), the same
 * signal `@typescript-eslint/consistent-type-imports` relies on, so no type-checker is needed.
 *
 * default and namespace imports are intentionally left untouched: combining them with named imports has too
 * many fragile shapes to autofix safely, and they are rarely type-only here.
 */

/**
 * @param {import('eslint').Scope.Variable | undefined} variable
 * @returns {boolean | null} true/false when known, null when it cannot be decided (unused)
 */
const isTypeOnlyVariable = (variable) => {
	if (!variable || variable.references.length === 0) {
		return null;
	}
	return variable.references.every((ref) => ref.isTypeReference && !ref.isValueReference);
};

/**
 * @param {import('estree').ImportSpecifier} specifier
 * @param {import('eslint').SourceCode} sourceCode
 * @returns {string} the `local` / `imported as local` text, without any `type` modifier
 */
const specifierText = (specifier, sourceCode) => {
	const imported =
		specifier.imported.type === 'Identifier'
			? specifier.imported.name
			: sourceCode.getText(specifier.imported);
	if (imported === specifier.local.name) {
		return imported;
	}
	return `${imported} as ${specifier.local.name}`;
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Enforce a single import per module with top-level `import type` when fully type-only and inline `type` specifiers otherwise',
		},
		fixable: 'code',
		schema: [],
		messages: {
			convention: 'Type-only imports from this module should be written as `{{expected}}`.',
		},
	},
	create(context) {
		const sourceCode = context.sourceCode;

		/** @type {Map<string, import('estree').ImportDeclaration[]>} */
		const bySource = new Map();

		return {
			ImportDeclaration(node) {
				if (typeof node.source.value !== 'string') {
					return;
				}
				const list = bySource.get(node.source.value);
				if (list) {
					list.push(node);
				} else {
					bySource.set(node.source.value, [node]);
				}
			},
			'Program:exit'() {
				for (const [source, declarations] of bySource) {
					// statements made entirely of named specifiers — the only shape we rewrite
					const namedDecls = declarations.filter(
						(decl) =>
							decl.specifiers.length > 0 && decl.specifiers.every((s) => s.type === 'ImportSpecifier'),
					);
					if (namedDecls.length === 0) {
						continue;
					}
					// bail if a default/namespace import for this module is in play — too fragile to merge
					const hasComplexSibling = declarations.some((decl) =>
						decl.specifiers.some(
							(s) => s.type === 'ImportDefaultSpecifier' || s.type === 'ImportNamespaceSpecifier',
						),
					);
					if (hasComplexSibling) {
						continue;
					}

					/**
					 * @type {{
					 * 	specifier: import('estree').ImportSpecifier;
					 * 	decl: import('estree').ImportDeclaration;
					 * 	typeOnly: boolean;
					 * }[]}
					 */
					const entries = [];
					let undecidable = false;
					for (const decl of namedDecls) {
						const declIsType = decl.importKind === 'type';
						for (const specifier of decl.specifiers) {
							const inlineType = specifier.importKind === 'type';
							let typeOnly;
							if (declIsType || inlineType) {
								typeOnly = true;
							} else {
								const [variable] = sourceCode.getDeclaredVariables(specifier);
								const decided = isTypeOnlyVariable(variable);
								if (decided === null) {
									undecidable = true;
									break;
								}
								typeOnly = decided;
							}
							entries.push({ decl, specifier, typeOnly });
						}
						if (undecidable) {
							break;
						}
					}
					if (undecidable) {
						continue;
					}

					const allType = entries.every((e) => e.typeOnly);
					const quote = sourceCode.getText(namedDecls[0].source);
					const expected = allType
						? `import type { ${entries.map((e) => specifierText(e.specifier, sourceCode)).join(', ')} } from ${quote};`
						: `import { ${entries
								.map((e) => `${e.typeOnly ? 'type ' : ''}${specifierText(e.specifier, sourceCode)}`)
								.join(', ')} } from ${quote};`;

					// already canonical? single statement whose markers all match
					if (namedDecls.length === 1) {
						const decl = namedDecls[0];
						const declIsType = decl.importKind === 'type';
						if (allType) {
							if (declIsType && decl.specifiers.every((s) => s.importKind !== 'type')) {
								continue;
							}
						} else {
							if (!declIsType && entries.every((e) => (e.specifier.importKind === 'type') === e.typeOnly)) {
								continue;
							}
						}
					}

					context.report({
						node: namedDecls[0],
						messageId: 'convention',
						data: { expected },
						fix(fixer) {
							const fixes = [fixer.replaceText(namedDecls[0], expected)];
							for (let i = 1; i < namedDecls.length; i++) {
								const decl = namedDecls[i];
								// also swallow the newline left behind by the removed statement
								const nextToken = sourceCode.getTokenAfter(decl, { includeComments: true });
								const end = nextToken ? nextToken.range[0] : decl.range[1];
								fixes.push(fixer.removeRange([decl.range[0], end]));
							}
							return fixes;
						},
					});
				}
			},
		};
	},
};
