/**
 * Remove useRequireEmailVerification wrapper-hook call sites.
 *
 * Usage:
 *   npx jscodeshift -t .jscodeshift/file/remove-email-verification-wrapper.js <files> --parser=tsx
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  root
    .find(j.ImportDeclaration, {
      source: {value: '#/lib/hooks/useRequireEmailVerification'},
    })
    .remove()

  root.find(j.VariableDeclaration).forEach(path => {
    const declarations = path.value.declarations.filter(decl => {
      return !(
        decl.type === 'VariableDeclarator' &&
        decl.id.type === 'Identifier' &&
        decl.id.name === 'requireEmailVerification' &&
        decl.init?.type === 'CallExpression' &&
        decl.init.callee.type === 'Identifier' &&
        decl.init.callee.name === 'useRequireEmailVerification'
      )
    })

    if (declarations.length === 0) {
      j(path).remove()
    } else {
      path.value.declarations = declarations
    }
  })

  root.find(j.CallExpression).forEach(path => {
    if (
      path.value.callee.type === 'Identifier' &&
      path.value.callee.name === 'requireEmailVerification' &&
      path.value.arguments.length > 0
    ) {
      j(path).replaceWith(path.value.arguments[0])
    }
  })

  root.find(j.ArrayExpression).forEach(path => {
    path.value.elements = path.value.elements.filter(element => {
      return !(
        element?.type === 'Identifier' &&
        element.name === 'requireEmailVerification'
      )
    })
  })

  return root.toSource({quote: 'single'})
}
