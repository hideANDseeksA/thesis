// hooks/useUserTransactions.js
import { apiWithLoading,api } from '@/lib/axios'
import { useEffect, useState, useCallback } from 'react'


export function useUserTransactions(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await api.get(
        `/transactions/user/${userId}`
      )

      setData(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load profile'
      )
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    resident: data?.resident || null,
    latestDocuments: data?.latest_documents || [],
    latestTransactions: data?.latest_transactions || [],
    latestComplaints: data?.latest_complaints || [],
    loading,
    error,
    refetch: fetchTransactions
  }
}
