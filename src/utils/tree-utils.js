// 由樹狀資料建 parentMap（fallback 用）
const buildParentMapFromTree = (rootOrList) => {
  const map = new Map()
  const arr = Array.isArray(rootOrList) ? rootOrList : [rootOrList]
  const dfs = (node, pid = null) => {
    map.set(node.id, pid)
    if (Array.isArray(node.children)) node.children.forEach((c) => dfs(c, node.id))
  }
  arr.forEach((n) => dfs(n, null))
  return map
}

// 以 parentMap 判斷 childId 是否為 possibleAncestorId 的子孫
const isDescendantByMap = (childId, possibleAncestorId, parentMap) => {
  if (childId == null || possibleAncestorId == null) return false
  let pid = parentMap.get(childId) ?? null
  while (pid != null) {
    if (pid === possibleAncestorId) return true
    pid = parentMap.get(pid) ?? null
  }
  return false
}

export default {
  buildParentMapFromTree,
  isDescendantByMap,
}
