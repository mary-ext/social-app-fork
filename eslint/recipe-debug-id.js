'use strict';

const RECIPE_SOURCE = '#/styles/recipe';

/**
 * @param node
 * @returns the node name, if applicable
 */
function getDeclaredName(node) {
	const parent = node.parent;
	if (parent && parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
		return parent.id.name;
	}
	return undefined;
}

/**
 * @param prop
 * @returns the property key or undefined if not resolvable
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
 * @param scope
 * @param name
 * @returns the variable with the given name in the scope, or undefined if not found
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
 * checks if the variable is defined
 *
 * @param variable the variable to check
 * @returns true if the variable is defined, false otherwise
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
