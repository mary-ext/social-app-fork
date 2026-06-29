'use strict';

const RECIPE_SOURCE = '#/styles/recipe';

/**
 * @param {import('estree').Node} node
 * @returns {string | undefined}
 */
function getDeclaredName(node) {
	const parent = node.parent;
	if (parent && parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
		return parent.id.name;
	}
	return undefined;
}

/**
 * @param {import('estree').Property} prop
 * @returns {string | undefined}
 */
function propertyKeyName(prop) {
	if (prop.computed) {
		return undefined;
	}
	if (prop.key.type === 'Identifier') {
		return prop.key.name;
	}
	if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
		return prop.key.value;
	}
	return undefined;
}

/**
 * @param {import('eslint').Scope.Scope} scope
 * @param {string} name
 * @returns {import('eslint').Scope.Variable | undefined}
 */
function resolveVariable(scope, name) {
	const variable = scope.variables.find((v) => v.name === name);
	if (variable) {
		return variable;
	}
	if (scope.upper) {
		return resolveVariable(scope.upper, name);
	}
	return undefined;
}

/**
 * @param {import('eslint').Scope.Variable | undefined} variable
 * @returns {boolean}
 */
function isRecipeImport(variable) {
	if (!variable) {
		return false;
	}
	return variable.defs.some((def) => {
		if (def.type !== 'ImportBinding') {
			return false;
		}
		const parent = def.parent;
		if (parent.type !== 'ImportDeclaration' || parent.source.value !== RECIPE_SOURCE) {
			return false;
		}
		const node = def.node;
		return (
			node.type === 'ImportSpecifier' &&
			node.imported.type === 'Identifier' &&
			node.imported.name === 'recipe'
		);
	});
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require a debugId option for recipe() calls',
		},
		fixable: 'code',
		schema: [],
		messages: {
			missingDebugId: 'Pass a debugId option to recipe() to keep generated class names readable.',
		},
	},
	create(context) {
		const sourceCode = context.sourceCode;

		return {
			CallExpression(node) {
				if (node.callee.type !== 'Identifier') {
					return;
				}

				const scope = sourceCode.getScope(node);
				const variable = resolveVariable(scope, node.callee.name);
				if (!isRecipeImport(variable)) {
					return;
				}

				const optionsArg = node.arguments[1];
				if (
					optionsArg &&
					optionsArg.type === 'ObjectExpression' &&
					optionsArg.properties.some((prop) => {
						if (prop.type !== 'Property') {
							return false;
						}
						return propertyKeyName(prop) === 'debugId';
					})
				) {
					return;
				}

				context.report({
					node,
					messageId: 'missingDebugId',
					fix(fixer) {
						const debugId = getDeclaredName(node);
						if (!debugId) {
							return null;
						}

						if (!optionsArg) {
							const firstArg = node.arguments[0];
							if (!firstArg) {
								return null;
							}
							return fixer.insertTextAfter(firstArg, `, { debugId: '${debugId}' }`);
						}

						if (optionsArg.type !== 'ObjectExpression') {
							return null;
						}

						if (optionsArg.loc.start.line !== optionsArg.loc.end.line) {
							return null;
						}

						if (optionsArg.properties.length === 0) {
							return fixer.replaceText(optionsArg, `{ debugId: '${debugId}' }`);
						}

						for (const prop of optionsArg.properties) {
							if (prop.type !== 'Property') {
								continue;
							}
							const name = propertyKeyName(prop);
							if (name !== undefined && name.localeCompare('debugId') > 0) {
								return fixer.insertTextBefore(prop, `debugId: '${debugId}', `);
							}
						}

						const lastProp = optionsArg.properties[optionsArg.properties.length - 1];
						return fixer.insertTextAfter(lastProp, `, debugId: '${debugId}'`);
					},
				});
			},
		};
	},
};
