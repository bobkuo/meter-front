import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import nodeService from 'src/services/node'
import utils from 'src/utils/tree-utils'

const LS_KEY = 'meterTree' // localStorage key

export const useMeterStore = defineStore('meter', () => {
  const treeData = ref([]) // 樹狀資料，給 QTree 顯示（存 localStorage）
  const parentMap = ref(new Map()) // 關係查表，id -> parentId|null（快速查父層）

  // 使用者選取（同層多選）
  const selectedIds = ref([]) // number[]
  const selectedParentId = ref(null) // number|null（root 用 null）
  const selectedNodes = ref([]) // { id, label }[]（給 UI 顯示）

  // localStorage 載入狀態
  const isLoading = ref(false)

  // 將 treeData 統一成陣列形式，方便帶入 QTree
  const normalizedRoots = computed(() => {
    return Array.isArray(treeData.value) ? treeData.value : [treeData.value]
  })

  // -----------------------------
  // localStorage
  // -----------------------------
  const loadFromLocal = () => {
    const raw = localStorage.getItem(LS_KEY)

    if (!raw) return false
    try {
      const data = JSON.parse(raw)
      treeData.value = data
      parentMap.value = utils.buildParentMapFromTree(data)
      return true
    } catch (e) {
      console.error('[LocalStorage] 解析失敗', e)
      return false
    }
  }

  // -----------------------------
  // API loaders
  // -----------------------------
  const loadFromApi = async () => {
    isLoading.value = true
    try {
      // 抓樹結構
      const { data } = await nodeService.fetchNodes()
      treeData.value = data
      parentMap.value = utils.buildParentMapFromTree(data)

      // 存 localStorage 快取
      localStorage.setItem(LS_KEY, JSON.stringify(treeData.value))

      return true
    } catch (e) {
      console.warn(`[API] 無法取得資料，將嘗試使用 localStorage 快取`, e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const init = async () => {
    const ok = await loadFromApi()
    if (ok) return { ok: true, source: 'api' }

    const localOk = loadFromLocal()
    if (localOk) return { ok: true, source: 'cache' }

    return { ok: false, source: 'none', error: '無法取得任何資料' }
  }

  // -----------------------------
  // selection
  // -----------------------------
  const resetSelection = () => {
    selectedIds.value = []
    selectedNodes.value = []
    selectedParentId.value = null
  }

  // 點選節點
  const toggleSelect = (node, { additive = false } = {}) => {
    const id = node.id
    const pid = parentMap.value.get(id) ?? null
    const label = node.label || `#${id}`

    // 非累加選取，或目前沒選任何東西：直接變單選
    if (!additive || selectedIds.value.length === 0) {
      selectedIds.value = [id]
      selectedNodes.value = [{ id, label }]
      selectedParentId.value = pid
      return
    }

    // 不允許跨層選：以最新點擊為基準變單選
    if (selectedParentId.value !== pid) {
      selectedIds.value = [id]
      selectedNodes.value = [{ id, label }]
      selectedParentId.value = pid
      return
    }

    // 累加選取：有就取消，沒有就加入
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1)
      selectedNodes.value.splice(idx, 1)
      if (selectedIds.value.length === 0) selectedParentId.value = null
    } else {
      selectedIds.value.push(id)
      selectedNodes.value.push({ id, label })
    }
  }

  // -----------------------------
  // move validation & action
  // -----------------------------
  //  拖曳時會用到的驗證：避免移到自身/子孫；避免與原父層相同
  const canMoveTo = (targetParentId) => {
    if (selectedIds.value.length === 0) return { ok: false, reason: '未選取節點' }

    if ((targetParentId ?? null) === (selectedParentId.value ?? null)) {
      return { ok: false, reason: '目標父層與原父層相同' }
    }

    for (const id of selectedIds.value) {
      if (targetParentId === id) return { ok: false, reason: '不可移到自身底下' }

      if (utils.isDescendantByMap(targetParentId, id, parentMap.value)) {
        return { ok: false, reason: '不可移到其子孫底下' }
      }
    }
    return { ok: true }
  }

  const moveSelected = async (targetParentId) => {
    // 驗證
    const check = canMoveTo(targetParentId)
    if (!check.ok) throw new Error(check.reason)

    const { data } = await nodeService.moveNodes({
      targetParentId: targetParentId ?? null,
      nodeIds: selectedIds.value,
    })
    if (!data?.success) throw new Error(data?.error || '移動失敗')

    // 成功後重新從後端為準，重整抓樹
    await loadFromApi()
    resetSelection()
  }

  return {
    // state
    treeData,
    parentMap,
    normalizedRoots,
    selectedIds,
    selectedNodes,
    selectedParentId,
    isLoading,

    // lifecycle
    init,
    loadFromApi,

    // selection & move
    toggleSelect,
    canMoveTo,
    moveSelected,
    resetSelection,
  }
})
