const FOLD_ENV = new Map([
  ['IS_NATIVE', false],
  ['IS_WEB', true],
  ['IS_IOS', false],
  ['IS_ANDROID', false],
  ['IS_LIQUID_GLASS', false],
  ['IS_TRANSLATION_SUPPORTED', false],
  ['IS_TESTFLIGHT', false],
])

const PLATFORM_HELPERS = new Set(['web', 'ios', 'android', 'native', 'platform'])

module.exports = function collapsePlatform(file, api) {
  const j = api.jscodeshift

  function bool(value) {
    return j.booleanLiteral(value)
  }

  function undef() {
    return j.identifier('undefined')
  }

  function asAny(node) {
    return j.tsAsExpression(node, j.tsAnyKeyword())
  }

  function preserveLooseStyleBoundary(node) {
    if (!node) return undef()
    if (node.type === 'ObjectExpression' || node.type === 'ArrayExpression') {
      return asAny(node)
    }
    return node
  }

  function isBool(node, value) {
    return node?.type === 'BooleanLiteral' && node.value === value
  }

  function isString(node, value) {
    return node?.type === 'StringLiteral' && node.value === value
  }

  function clone(node) {
    return JSON.parse(JSON.stringify(node))
  }

  function keyName(key) {
    if (!key) return undefined
    if (key.type === 'Identifier') return key.name
    if (key.type === 'StringLiteral' || key.type === 'Literal') return key.value
    return undefined
  }

  function isReference(path) {
    const node = path.node
    const parent = path.parent?.node
    if (!parent || node.type !== 'Identifier') return false
    if (
      parent.type === 'ImportSpecifier' ||
      parent.type === 'ImportDefaultSpecifier' ||
      parent.type === 'ImportNamespaceSpecifier'
    ) {
      return false
    }
    if (
      parent.type === 'MemberExpression' &&
      parent.property === node &&
      parent.computed === false
    ) {
      return false
    }
    if (
      (parent.type === 'ObjectProperty' || parent.type === 'Property') &&
      parent.key === node &&
      parent.computed === false
    ) {
      return false
    }
    if (
      parent.type === 'ObjectMethod' ||
      parent.type === 'ClassMethod' ||
      parent.type === 'TSTypeReference' ||
      parent.type === 'TSQualifiedName' ||
      parent.type === 'TSPropertySignature'
    ) {
      return false
    }
    return true
  }

  function collectImports(root) {
    const envConstants = new Map()
    const helpers = new Map()
    const platformObjects = new Set()
    const ownedImports = new Set()

    root.find(j.ImportDeclaration).forEach(path => {
      const source = path.node.source.value
      const specifiers = path.node.specifiers || []
      for (const spec of specifiers) {
        if (spec.type !== 'ImportSpecifier') continue
        const imported = spec.imported.name || spec.imported.value
        const local = spec.local?.name || imported

        if (
          (source === '#/env' || source === '#/env/common') &&
          FOLD_ENV.has(imported)
        ) {
          envConstants.set(local, FOLD_ENV.get(imported))
          ownedImports.add(local)
        }

        if (
          (source === '#/alf' ||
            source === '#/alf/util/platform' ||
            source === '#/alf/base/platform') &&
          PLATFORM_HELPERS.has(imported)
        ) {
          helpers.set(local, imported)
          ownedImports.add(local)
        }

        if (source === 'react-native' && imported === 'Platform') {
          platformObjects.add(local)
          ownedImports.add(local)
        }
      }
    })

    return {envConstants, helpers, platformObjects, ownedImports}
  }

  function platformSelect(arg) {
    if (!arg || arg.type !== 'ObjectExpression') return undefined
    let fallback
    for (const prop of arg.properties) {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue
      const name = keyName(prop.key)
      if (name === 'web') return prop.value
      if (name === 'default') fallback = prop.value
    }
    return preserveLooseStyleBoundary(fallback || undef())
  }

  function simplifyExpression(node) {
    if (!node) return node

    if (node.type === 'UnaryExpression' && node.operator === '!') {
      if (isBool(node.argument, true)) return bool(false)
      if (isBool(node.argument, false)) return bool(true)
    }

    if (node.type === 'ConditionalExpression') {
      if (isBool(node.test, true)) return node.consequent
      if (isBool(node.test, false)) return node.alternate
    }

    if (node.type === 'LogicalExpression') {
      if (node.operator === '&&') {
        if (isBool(node.left, true)) return node.right
        if (isBool(node.left, false)) return bool(false)
        if (isBool(node.right, true)) return node.left
        if (isBool(node.right, false)) return bool(false)
      }
      if (node.operator === '||') {
        if (isBool(node.left, true)) return bool(true)
        if (isBool(node.left, false)) return node.right
        if (isBool(node.right, true)) return bool(true)
        if (isBool(node.right, false)) return node.left
      }
    }

    if (node.type === 'BinaryExpression') {
      const eq = node.operator === '===' || node.operator === '=='
      const neq = node.operator === '!==' || node.operator === '!='
      if ((eq || neq) && node.left.type === node.right.type) {
        if (node.left.type === 'StringLiteral') {
          const same = node.left.value === node.right.value
          return bool(eq ? same : !same)
        }
        if (node.left.type === 'BooleanLiteral') {
          const same = node.left.value === node.right.value
          return bool(eq ? same : !same)
        }
      }
    }

    return node
  }

  function simplifyStatements(root) {
    let changed = false
    root.find(j.IfStatement).forEach(path => {
      const test = path.node.test
      if (!isBool(test, true) && !isBool(test, false)) return
      changed = true
      const selected = isBool(test, true) ? path.node.consequent : path.node.alternate
      const parent = path.parent?.node
      const canReplaceWithList =
        (parent?.type === 'Program' || parent?.type === 'BlockStatement') &&
        Array.isArray(parent.body)
      if (!selected) {
        j(path).remove()
      } else if (selected.type === 'BlockStatement') {
        if (canReplaceWithList) {
          j(path).replaceWith(selected.body)
        } else if (selected.body.length === 1) {
          j(path).replaceWith(selected.body[0])
        } else {
          j(path).replaceWith(selected)
        }
      } else {
        j(path).replaceWith(selected)
      }
    })
    return changed
  }

  function filterArrays(root) {
    let changed = false
    root.find(j.ArrayExpression).forEach(path => {
      const elements = path.node.elements
      const filtered = elements.filter(el => !isBool(el, true) && !isBool(el, false))
      if (filtered.length !== elements.length && filtered.length > 1) {
        path.node.elements = filtered
        changed = true
      }
    })
    return changed
  }

  function filterObjectSpreads(root) {
    let changed = false
    root.find(j.ObjectExpression).forEach(path => {
      const before = path.node.properties.length
      path.node.properties = path.node.properties.filter(prop => {
        if (prop.type !== 'SpreadElement' && prop.type !== 'SpreadProperty') {
          return true
        }
        const arg = prop.argument
        if (isBool(arg, false) || isBool(arg, true)) return false
        if (arg?.type === 'Identifier' && arg.name === 'undefined') return false
        if (
          arg?.type === 'TSAsExpression' &&
          arg.expression.type === 'Identifier' &&
          arg.expression.name === 'undefined'
        ) {
          return false
        }
        return true
      })
      if (path.node.properties.length !== before) changed = true
    })
    return changed
  }

  function removeUnreachable(root) {
    let changed = false
    root.find(j.BlockStatement).forEach(path => {
      const body = path.node.body
      const index = body.findIndex(stmt => stmt.type === 'ReturnStatement')
      if (index !== -1 && index < body.length - 1) {
        path.node.body = body
          .slice(0, index + 1)
          .concat(body.slice(index + 1).filter(stmt => stmt.type === 'FunctionDeclaration'))
        changed = true
      }
    })
    return changed
  }

  function filterJsx(root) {
    let changed = false
    root.find(j.JSXElement).forEach(path => {
      const before = path.node.children.length
      path.node.children = path.node.children.filter(child => {
        if (child.type !== 'JSXExpressionContainer') return true
        return !isBool(child.expression, false)
      })
      if (path.node.children.length !== before) changed = true
    })
    return changed
  }

  function hasReference(root, name) {
    let found = false
    root.find(j.Identifier, {name}).forEach(path => {
      if (!found && isReference(path)) found = true
    })
    return found
  }

  function removeOwnedImports(root, ownedImports) {
    let changed = false
    root.find(j.ImportDeclaration).forEach(path => {
      const specifiers = path.node.specifiers || []
      const next = specifiers.filter(spec => {
        const local = spec.local?.name
        if (!local || !ownedImports.has(local)) return true
        return hasReference(root, local)
      })
      if (next.length !== specifiers.length) {
        changed = true
        if (next.length === 0) {
          j(path).remove()
        } else {
          path.node.specifiers = next
        }
      }
    })
    return changed
  }

  let source = file.source
  for (let pass = 0; pass < 6; pass++) {
    const root = j(source)
    const {envConstants, helpers, platformObjects, ownedImports} = collectImports(root)

    platformObjects.forEach(local => {
      root
        .find(j.MemberExpression, {
          object: {type: 'Identifier', name: local},
          property: {type: 'Identifier', name: 'OS'},
          computed: false,
        })
        .replaceWith(() => j.stringLiteral('web'))
    })

    envConstants.forEach((value, local) => {
      root.find(j.Identifier, {name: local}).forEach(path => {
        if (isReference(path)) j(path).replaceWith(bool(value))
      })
    })

    helpers.forEach((imported, local) => {
      root
        .find(j.CallExpression, {
          callee: {type: 'Identifier', name: local},
        })
        .forEach(path => {
          if (imported === 'web') {
            j(path).replaceWith(
              preserveLooseStyleBoundary(path.node.arguments[0] || undef()),
            )
          } else if (imported === 'platform') {
            j(path).replaceWith(platformSelect(path.node.arguments[0]))
          } else {
            j(path).replaceWith(asAny(undef()))
          }
        })
    })

    root
      .find(j.Expression)
      .forEach(path => {
        const next = simplifyExpression(path.node)
        if (next !== path.node) j(path).replaceWith(next)
      })

    root.find(j.JSXExpressionContainer).forEach(path => {
      const next = simplifyExpression(path.node.expression)
      if (next !== path.node.expression) path.node.expression = next
    })

    simplifyStatements(root)
    filterArrays(root)
    filterObjectSpreads(root)
    filterJsx(root)
    removeUnreachable(root)
    removeOwnedImports(root, ownedImports)

    const nextSource = root.toSource({quote: 'single', trailingComma: true})
    if (nextSource === source) return nextSource
    source = nextSource
  }

  return source
}
