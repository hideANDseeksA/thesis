import { useEffect, useState } from "react";
import axios from "axios";

export function useWebsiteStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/analytics/website/stats`,
        {
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY,
          },
        }
      );

      setData(res.data);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unknown error"
      );

      console.error("Failed to fetch stats:", err);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchStats
  };
}