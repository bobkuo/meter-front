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

//
// 在樹中移除多個節點
const removeNodesByIds = (nodes, ids) => {
  let removedNodes = []
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (ids.includes(n.id)) {
      removedNodes.push(nodes.splice(i, 1)[0])
    } else if (n.children) {
      const removed = removeNodesByIds(n.children, ids)
      removedNodes.push(...removed)
    }
  }
  return removedNodes
}

// 在樹中找目標節點
const findNodeById = (nodes, nodeId) => {
  for (const n of nodes) {
    if (n.id === nodeId) return n
    if (n.children) {
      const found = findNodeById(n.children, nodeId)
      if (found) return found
    }
  }
  return null
}

//
const moveNodesInTree = (tree, selectedIds, targetParentId) => {
  // 移除tree中被選取的節點，並取出這些節點
  const nodesToMove = removeNodesByIds(tree, selectedIds)
  if (!nodesToMove.length) return false

  // 移到 root
  if (!targetParentId) {
    tree.push(...nodesToMove)
    return true
  }

  // 移到指定節點下
  const target = findNodeById(tree, targetParentId)
  if (!target) return false

  if (!target.children) target.children = []
  target.children.push(...nodesToMove)
  return true
}

export default {
  buildParentMapFromTree,
  isDescendantByMap,
  moveNodesInTree,
}
