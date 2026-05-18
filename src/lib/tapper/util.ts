import {type TapperFacet,type TapperFacetConfig, type TapperNode} from './types'

const WHITESPACE = /\s/
// Regexes whose source starts with this prefix use a leading capture group
// to gate matches on a boundary (start-of-string, whitespace, or `(`) without
// lookbehind. The captured boundary char is stripped from the match so
// positions and `raw` reflect the facet itself.
const BOUNDARY_PREFIX = '(^|\\s|\\()'

// Mirror the regex's `(^|\s|\()` gate so trigger detection (for chars typed
// before any regex match exists) doesn't fire mid-word — e.g. the `@` inside
// `eric@blueskyweb.xyz` should not synthesize a mention trigger.
function isBoundaryBefore(text: string, i: number) {
  if (i === 0) return true
  const prev = text[i - 1]
  return prev === '(' || WHITESPACE.test(prev)
}
let nextNodeId = 0

export type CompiledFacetRegexes = Map<string, RegExp>

/**
 * Pre-compile facet regexes once at init time. This avoids re-creating
 * RegExp objects on every keystroke in parseNodesFromText. Each Tapper
 * instance gets its own compiled copy so lastIndex state can't leak
 * between instances.
 */
export function compileFacetRegexes(
  config: TapperFacetConfig,
): CompiledFacetRegexes {
  const compiled = new Map<string, RegExp>()
  for (const [name, re] of Object.entries(config)) {
    compiled.set(name, new RegExp(re.source, re.flags))
  }
  return compiled
}

export function parseNodesFromText(
  text: string,
  regexes: CompiledFacetRegexes,
  prevNodes?: TapperNode[],
  cursor?: number,
  triggers?: Map<string, string>,
): TapperNode[] {
  const allMatches: {
    facetName: string
    fullMatch: string
    capture: string
    index: number
  }[] = []

  for (const [name, re] of regexes) {
    // Reset lastIndex so stateful (global) regexes don't carry over
    // match positions from the previous parse call.
    re.lastIndex = 0
    // Boundary-gated regexes shift the effective start past the captured
    // boundary char (m[1]) and bump the value capture index by one.
    const hasBoundary = re.source.startsWith(BOUNDARY_PREFIX)
    for (const m of text.matchAll(re)) {
      const boundaryLen = hasBoundary ? (m[1]?.length ?? 0) : 0
      const fullMatch = m[0].slice(boundaryLen)
      allMatches.push({
        facetName: name,
        fullMatch,
        capture: (hasBoundary ? m[2] : m[1]) ?? fullMatch,
        index: m.index + boundaryLen,
      })
    }
  }

  allMatches.sort(
    (a, b) => a.index - b.index || b.fullMatch.length - a.fullMatch.length,
  )

  const accepted: typeof allMatches = []
  let lastEnd = 0
  for (const m of allMatches) {
    if (m.index >= lastEnd) {
      accepted.push(m)
      lastEnd = m.index + m.fullMatch.length
    }
  }

  const nodes: TapperNode[] = []
  let pos = 0

  for (const m of accepted) {
    if (m.index > pos) {
      const raw = text.slice(pos, m.index)
      nodes.push({
        id: nextNodeId++,
        type: 'text',
        raw,
        value: raw,
        start: pos,
        end: m.index,
      })
    }
    nodes.push({
      id: nextNodeId++,
      type: 'facet',
      facetType: m.facetName,
      raw: m.fullMatch,
      value: m.capture,
      start: m.index,
      end: m.index + m.fullMatch.length,
    })
    pos = m.index + m.fullMatch.length
  }

  if (pos < text.length) {
    const raw = text.slice(pos)
    nodes.push({
      id: nextNodeId++,
      type: 'text',
      raw,
      value: raw,
      start: pos,
      end: text.length,
    })
  }

  // If the cursor is right after a trigger char that the regex didn't match,
  // splice a 'trigger' node out of the containing text node.
  if (cursor != null && triggers) {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = text[i]
      if (WHITESPACE.test(ch)) break
      const facetType = triggers.get(ch)
      if (facetType && isBoundaryBefore(text, i)) {
        // Only create a trigger node if the trigger is inside a text node
        // (i.e. the regex didn't already match it as a facet)
        const textNodeIdx = nodes.findIndex(
          n => n.type === 'text' && n.start <= i && n.end > i,
        )
        if (textNodeIdx !== -1) {
          const node = nodes[textNodeIdx]
          const spliced: TapperNode[] = []
          if (node.start < i) {
            const raw = text.slice(node.start, i)
            spliced.push({
              id: nextNodeId++,
              type: 'text',
              raw,
              value: raw,
              start: node.start,
              end: i,
            })
          }
          const triggerRaw = text.slice(i, cursor)
          spliced.push({
            id: nextNodeId++,
            type: 'trigger',
            facetType,
            raw: triggerRaw,
            value: text.slice(i + ch.length, cursor),
            start: i,
            end: cursor,
          })
          if (cursor < node.end) {
            const raw = text.slice(cursor, node.end)
            spliced.push({
              id: nextNodeId++,
              type: 'text',
              raw,
              value: raw,
              start: cursor,
              end: node.end,
            })
          }
          nodes.splice(textNodeIdx, 1, ...spliced)
        }
        break
      }
    }
  }

  // Transfer committed flags and stable IDs from previous nodes
  if (prevNodes) {
    // Facet nodes: match by facetType + occurrence index
    const counts = new Map<string, number>()
    const prevFacetsByTypeIndex = new Map<string, TapperNode>()

    for (const node of prevNodes) {
      if (node.type !== 'facet') continue
      const idx = counts.get(node.facetType) ?? 0
      counts.set(node.facetType, idx + 1)
      prevFacetsByTypeIndex.set(`${node.facetType}:${idx}`, node)
    }

    counts.clear()
    for (const node of nodes) {
      if (node.type !== 'facet') continue
      const idx = counts.get(node.facetType) ?? 0
      counts.set(node.facetType, idx + 1)
      const prev = prevFacetsByTypeIndex.get(`${node.facetType}:${idx}`)
      if (prev) {
        node.id = prev.id
        if (prev.committed) node.committed = true
      }
    }

    // Text nodes: match by start position
    const prevTextByStart = new Map<number, TapperNode>()
    for (const node of prevNodes) {
      if (node.type === 'text') prevTextByStart.set(node.start, node)
    }
    for (const node of nodes) {
      if (node.type === 'text') {
        const prev = prevTextByStart.get(node.start)
        if (prev) node.id = prev.id
      }
    }
  }

  return nodes
}

export function deriveTriggers(config: TapperFacetConfig): Map<string, string> {
  const triggers = new Map<string, string>()
  for (const [name, re] of Object.entries(config)) {
    // Skip the boundary prefix (if present) before extracting the trigger char.
    const src = re.source.startsWith(BOUNDARY_PREFIX)
      ? re.source.slice(BOUNDARY_PREFIX.length)
      : re.source
    const m = src.match(/^[^\\([\]{}.*+?^$|]+/)
    if (m) triggers.set(m[0], name)
  }
  return triggers
}

export function nodeToFacet(node: TapperNode): TapperFacet {
  return {
    type: node.facetType!,
    raw: node.raw,
    value: node.value,
    range: {start: node.start, end: node.end},
  }
}

export function detectActiveFacet(
  nodes: TapperNode[],
  text: string,
  cursor: number,
  triggers: Map<string, string>,
): TapperFacet | null {
  for (const node of nodes) {
    if (node.type === 'trigger' && node.start < cursor && cursor <= node.end) {
      return {
        type: node.facetType,
        raw: node.raw,
        value: node.value,
        range: {start: node.start, end: node.end},
      }
    }
    if (
      node.type === 'facet' &&
      !node.committed &&
      node.start < cursor &&
      cursor <= node.end
    ) {
      return {
        type: node.facetType,
        raw: node.raw,
        value: node.value,
        range: {start: node.start, end: node.end},
      }
    }
  }

  // Scan backward from cursor for a trigger char (partial facet not yet matched by regex).
  // Skip if the cursor is inside or at the end of a committed facet.
  const inCommitted = nodes.some(
    n =>
      n.type === 'facet' && n.committed && n.start < cursor && cursor <= n.end,
  )
  if (!inCommitted) {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = text[i]
      // Stop at whitespace — triggers don't span across words
      if (WHITESPACE.test(ch)) break
      const type = triggers.get(ch)
      if (type && isBoundaryBefore(text, i)) {
        const raw = text.slice(i, cursor)
        return {
          type,
          raw,
          value: text.slice(i + 1, cursor),
          range: {start: i, end: cursor},
        }
      }
    }
  }

  return null
}
