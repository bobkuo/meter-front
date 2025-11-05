<template>
  <q-page padding>
    <div class="q-gutter-md">
      <!-- 顯示目前伺服器 + 改變伺服器按鈕 -->
      <div class="row items-center justify-between">
        <div class="text-caption text-grey-7">
          目前伺服器：
          <span class="text-weight-medium">{{ serverUrlText }}</span>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-btn outline dense icon="settings_ethernet" label="改變伺服器" @click="changeServer" />
        </div>
      </div>

      <!-- 主內容：讀取完成後才顯示 -->
      <template v-if="ready">
        <q-banner v-if="store.isLoading" dense class="bg-grey-2">讀取中…</q-banner>
        <meter-tree @open-move-dialog="dialogOpen = true" />
        <move-dialog v-model="dialogOpen" />
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useMeterStore } from 'src/stores/meter'
import api, { setBaseURL } from 'src/services/api'

import MeterTree from 'src/components/MeterTree.vue'
import MoveDialog from 'src/components/MoveDialog.vue'

const $q = useQuasar()
const store = useMeterStore()

const dialogOpen = ref(false)
const ready = ref(!!localStorage.getItem('serverUrl')) // 取得到再渲染畫面

// 顯示目前的連線 URL
const serverUrlText = computed(() => api.defaults.baseURL || '(未設定)')

// 讓 Quasar Dialog 可用 await
const askServer = () =>
  new Promise((resolve) => {
    $q.dialog({
      title: '設定伺服器位置',
      message: '請輸入 API 伺服器的 Base URL（例如：http://localhost:3001）',
      prompt: {
        model: localStorage.getItem('serverUrl') || 'http://localhost:3001',
        type: 'text',
      },
      cancel: true,
      persistent: true,
    })
      .onOk((v) => resolve({ ok: true, url: v }))
      .onCancel(() => resolve({ ok: false }))
  })

const loadData = async () => {
  // store.init()：先呼叫API 若失敗再抓localStorage
  const res = await store.init()
  if (res.ok) {
    const serverUrl = api.defaults.baseURL
    $q.notify({
      type: res.source === 'api' ? 'positive' : 'warning',
      message:
        res.source === 'api'
          ? `已從伺服器載入資料\n(${serverUrl})`
          : `伺服器無回應，使用快取資料\n(${serverUrl})`,
    })
    ready.value = true
  } else {
    $q.notify({ type: 'negative', message: res.error || '資料載入失敗' })
  }
}

// 變更伺服器按鈕
const changeServer = async () => {
  const { ok, url } = await askServer()
  if (!ok || !url) return
  setBaseURL(url)
  $q.notify({ type: 'info', message: `已切換伺服器：${api.defaults.baseURL}` })
  // 重新抓資料
  await loadData()
}

onMounted(async () => {
  // localStorage若沒有serverUrl，跳對話框詢問
  if (!localStorage.getItem('serverUrl')) {
    const { ok, url } = await askServer()
    if (ok && url) {
      setBaseURL(url)
      ready.value = true
      await loadData()
      return
    }
    // 使用者取消就直接用預設的serverUrl
    ready.value = true
    await loadData()
    return
  }

  // 有serverUrl就直接載入
  ready.value = true
  await loadData()
})
</script>
