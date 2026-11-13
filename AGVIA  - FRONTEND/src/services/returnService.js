import api from './api'

export const returnService = {
  /**
   * Submit a return or size exchange request (Patron action)
   */
  async createReturn(payload) {
    try {
      const { data } = await api.post('/returns', payload)
      return data?.data
    } catch (err) {
      console.error('[returnService.createReturn] Error:', err)
      throw err
    }
  },

  /**
   * Fetch all returns submitted by the logged-in patron
   */
  async getMyReturns() {
    try {
      const { data } = await api.get('/returns')
      return Array.isArray(data?.data) ? data.data : []
    } catch (err) {
      console.error('[returnService.getMyReturns] Error:', err)
      throw err
    }
  },

  /**
   * Fetch return requests for a specific order
   */
  async getOrderReturns(orderId) {
    if (!orderId) return []
    try {
      const { data } = await api.get(`/returns/order/${orderId}`)
      return Array.isArray(data?.data) ? data.data : []
    } catch (err) {
      console.error('[returnService.getOrderReturns] Error:', err)
      throw err
    }
  },

  /**
   * Fetch single return detail by ID
   */
  async getReturnById(id) {
    try {
      const { data } = await api.get(`/returns/${id}`)
      return data?.data
    } catch (err) {
      console.error('[returnService.getReturnById] Error:', err)
      throw err
    }
  },

  /**
   * Admin: List all returns with status filter & pagination
   */
  async adminGetAllReturns({ status, page = 0, size = 20 } = {}) {
    try {
      const params = { page, size }
      if (status && status !== 'ALL') {
        params.status = status
      }
      const { data } = await api.get('/admin/returns', { params })
      return data?.data
    } catch (err) {
      console.error('[returnService.adminGetAllReturns] Error:', err)
      throw err
    }
  },

  /**
   * Admin: Get return request details
   */
  async adminGetReturnById(id) {
    try {
      const { data } = await api.get(`/admin/returns/${id}`)
      return data?.data
    } catch (err) {
      console.error('[returnService.adminGetReturnById] Error:', err)
      throw err
    }
  },

  /**
   * Admin: Update return status / assign courier / issue credit
   */
  async adminUpdateReturnDecision(id, decision) {
    try {
      const { data } = await api.put(`/admin/returns/${id}/decision`, decision)
      return data?.data
    } catch (err) {
      console.error('[returnService.adminUpdateReturnDecision] Error:', err)
      throw err
    }
  }
}

export default returnService
