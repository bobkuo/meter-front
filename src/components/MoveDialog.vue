<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-h6">移動階層</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <div class="text-body2">選取的節點：</div>
        <q-chip
          v-for="node in selectedNodes"
          :key="node.id"
          square
          dense
          color="primary"
          text-color="white"
          >{{ node.label }}</q-chip
        >
        <q-select
          v-model="target"
          :options="options"
          label="目標父電表"
          hint="（選『第 0 層（root）』代表移到最上層）"
          option-value="id"
          option-label="label"
          emit-value
          map-options
          dense
          clearable
        >
          <template #option="scope">
            <q-item :disable="scope.opt.disable" clickable @click="scope.toggleOption(scope.opt)">
              <q-item-section avatar>
                <!-- 加入圖示 -->
                <q-icon
                  :name="scope.opt.disable ? 'block' : 'folder'"
                  :color="scope.opt.disable ? 'grey' : 'primary'"
                />
              </q-item-section>

              <q-item-section>
                <div class="row items-center" :class="{ 'text-grey-6': scope.opt.disable }">
                  <span>{{ scope.opt.label }}</span>
                  <span v-if="scope.opt.disable" class="text-caption q-ml-xs"> （不可選） </span>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="取消" v-close-popup />
        <q-btn color="primary" label="確定" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useMeterStore } from 'src/stores/meter'
import utils from 'src/utils/tree-utils'

const $q = useQuasar()
const store = useMeterStore()

const show = defineModel({ type: Boolean, default: false })

const selectedNodes = computed(() => store.selectedNodes)

// 目標父節點（null 代表 root）
const target = ref(null)

// 是否不可被選為移動目標
const isForbiddenTarget = (candidateId) => {
  // 選取的節點有自己
  if (store.selectedIds.includes(candidateId)) return true

  //  選取的節點有自己的子孫
  for (const sid of store.selectedIds) {
    if (utils.isDescendantByMap(candidateId, sid, store.parentMap)) return true
  }

  // 選取節點的父層就是自己
  if ((candidateId ?? null) === (store.selectedParentId ?? null)) return true

  return false
}

// 產生選單選項（不可選自己或自己的子孫）
const options = computed(() => {
  const opts = []

  // root (第 0 層)
  opts.push({
    id: null,
    label: '第 0 層（root）',
    disable: isForbiddenTarget(null),
  })

  // 其他節點
  const addNode = (n) => {
    opts.push({
      id: n.id,
      label: `${n.name} (#${n.id})`,
      disable: isForbiddenTarget(n.id),
    })
    if (Array.isArray(n.children)) n.children.forEach(addNode)
  }
  store.normalizedRoots.forEach(addNode)

  return opts
})

watch(show, (v) => {
  if (v) target.value = null
})

const onSubmit = async () => {
  try {
    await store.moveSelected(target.value ?? null)
    $q.notify({ type: 'positive', message: '移動成功' })
    show.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || '移動失敗' })
  }
}
</script>
