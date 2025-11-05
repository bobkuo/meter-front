import api from './api'

export default {
  async fetchNodes(flat = false) {
    return api.get('/nodes', { params: { flat } })
  },
  async moveNodes({ targetParentId, nodeIds }) {
    return api.patch('/nodes/move', {
      target_parent_id: targetParentId ?? null,
      node_ids: nodeIds,
    })
  },
}
