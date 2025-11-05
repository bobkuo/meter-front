<template>
  <q-card flat bordered>
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle2">階層設定關係圖</div>
      <q-btn
        color="primary"
        label="移動階層"
        :disable="selectedIds.length === 0"
        @click="$emit('open-move-dialog')"
        unelevated
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="scroll" style="max-height: 70vh">
      <q-tree
        :nodes="qTreeNodes"
        node-key="id"
        label-key="label"
        children-key="children"
        :default-expand-all="true"
      >
        <!-- 自訂每個樹節點的標題區塊(取名為scope), 對每個節點加入拖曳事件和選取時變色 -->
        <template #default-header="scope">
          <div
            class="row items-center q-gutter-sm q-px-sm q-py-xs rounded-borders cursor-pointer"
            :class="{
              'bg-primary text-white': selectedIds.includes(scope.node.id),
            }"
            draggable="true"
            @dragstart="onDragStart($event, scope.node)"
            @dragover.stop.prevent="onDragOver($event, scope.node)"
            @drop.stop.prevent="onDrop($event, scope.node)"
            @click.stop="onNodeClick($event, scope.node)"
          >
            <q-icon
              size="16px"
              :name="scope.node.children?.length ? 'folder' : 'insert_drive_file'"
            />
            <div class="text-body2">{{ scope.node.label }}</div>
          </div>
        </template>
      </q-tree>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useMeterStore } from 'src/stores/meter'

const store = useMeterStore()

const selectedIds = computed(() => store.selectedIds)

// 將後端的樹轉成 QTree 需要的格式
const qTreeNodes = computed(() => {
  const toQtree = (n) => ({
    id: n.id,
    label: `${n.name} (#${n.id})`,
    children: Array.isArray(n.children) ? n.children.map(toQtree) : [],
  })
  return store.normalizedRoots.map(toQtree)
})

function onNodeClick(evt, node) {
  // 按alt / ctrl / cmd 鍵可多選
  const additive = evt.altKey || evt.ctrlKey || evt.metaKey
  store.toggleSelect({ id: node.id, label: node.label }, { additive })
}

// -----------------------------
// 拖曳功能，將節點拖到目標節點，等同將選取改為被拖曳者，目標為 drop 目標
// -----------------------------

// 把目前多選集合打包起來放到 dataTransfer
const onDragStart = (evt, node) => {
  if (!selectedIds.value.includes(node.id)) {
    // 起拖的是未被選取的節點 → 切換成只選它
    store.toggleSelect({ id: node.id, label: node.label }, { additive: false })
  }

  // 標準設置 符合部分瀏覽器需求
  evt.dataTransfer.setData('text/plain', 'moving-nodes')

  evt.dataTransfer.setData(
    'application/x-meter-node-move',
    JSON.stringify({ nodeIds: selectedIds.value.slice() }),
  )
  evt.dataTransfer.effectAllowed = 'copyMove'
}

// 拖曳時用 canMoveTo 來即時給予正確的 dropEffect（copy/none）
const onDragOver = (evt, targetNode) => {
  const check = store.canMoveTo(targetNode.id)
  evt.dataTransfer.dropEffect = check.ok ? 'copy' : 'none'
}

// drop時再次用 canMoveTo 驗證，再呼叫 moveSelected（會把整個多選集合移到 targetNode.id）
const onDrop = async (evt, targetNode) => {
  try {
    await store.moveSelected(targetNode.id)
  } catch (e) {
    console.warn(e.message)
  }
}
</script>
