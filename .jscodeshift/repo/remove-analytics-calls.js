module.exports = function removeAnalyticsCalls(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  function isWhitespaceText(node) {
    return node.type === 'JSXText' && node.value.trim() === ''
  }

  function isAnalyticsContextName(name) {
    return name.type === 'JSXIdentifier' && name.name === 'AnalyticsContext'
  }

  root
    .find(j.ExpressionStatement)
    .filter(path => {
      const expr = path.node.expression
      return (
        expr.type === 'CallExpression' &&
        expr.callee.type === 'MemberExpression' &&
        expr.callee.object.type === 'Identifier' &&
        expr.callee.object.name === 'ax' &&
        !expr.callee.computed &&
        expr.callee.property.type === 'Identifier' &&
        expr.callee.property.name === 'metric'
      )
    })
    .remove()

  root
    .find(j.JSXElement)
    .filter(path => isAnalyticsContextName(path.node.openingElement.name))
    .replaceWith(path => {
      const children = path.node.children.filter(child => !isWhitespaceText(child))
      if (children.length === 1) {
        return children[0]
      }
      return j.jsxFragment(
        j.jsxOpeningFragment(),
        j.jsxClosingFragment(),
        children,
      )
    })

  function isImportIdentifier(path) {
    return path.parent?.node.type === 'ImportSpecifier'
  }

  function isDeclarationIdentifier(path) {
    return path.parent?.node.type === 'VariableDeclarator'
  }

  function isDependencyIdentifier(path) {
    return path.parent?.node.type === 'ArrayExpression'
  }

  function referencesFor(name) {
    const refs = []
    root.find(j.Identifier, {name}).forEach(path => {
      if (isImportIdentifier(path) || isDeclarationIdentifier(path)) {
        return
      }
      refs.push(path)
    })
    return refs
  }

  root
    .find(j.VariableDeclarator)
    .filter(path => {
      const {id, init} = path.node
      return (
        id.type === 'Identifier' &&
        init?.type === 'CallExpression' &&
        init.callee.type === 'Identifier' &&
        init.callee.name === 'useAnalytics'
      )
    })
    .forEach(path => {
      const name = path.node.id.name
      const refs = referencesFor(name)
      if (refs.length > 0 && refs.every(isDependencyIdentifier)) {
        root.find(j.ArrayExpression).forEach(arrayPath => {
          arrayPath.node.elements = arrayPath.node.elements.filter(element => {
            return !(element?.type === 'Identifier' && element.name === name)
          })
        })
      }

      if (referencesFor(name).length === 0) {
        const declaration = path.parent.node
        if (declaration.declarations.length === 1) {
          j(path.parent).remove()
        } else {
          declaration.declarations = declaration.declarations.filter(
            declarationPath => declarationPath !== path.node,
          )
        }
      }
    })

  root
    .find(j.ImportDeclaration, {source: {value: '#/analytics'}})
    .forEach(path => {
      path.node.specifiers = path.node.specifiers.filter(specifier => {
        const local = specifier.local?.name
        if (!local) return true
        return referencesFor(local).length > 0
      })
      if (path.node.specifiers.length === 0) {
        j(path).remove()
      }
    })

  return root.toSource({quote: 'single'})
}
