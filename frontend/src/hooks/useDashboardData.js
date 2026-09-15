import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Resolve the backend API base URL from Vite environment variables or default to localhost
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/**
 * Custom hook to periodically fetch monitoring dashboard data:
 * - Sites availability & response statuses
 * - System health metrics (CPU, RAM, Disk, Uptime)
 * - GitHub deployment & commit statuses
 *
 * Runs on initial mount and repeats every 30 seconds.
 *
 * @returns {{
 *   sites: Array,
 *   health: Object|null,
 *   githubStatus: Array,
 *   loading: boolean,
 *   error: string|null,
 *   lastUpdated: Date|null,
 *   refetch: Function
 * }}
 */
export function useDashboardData() {
  const [sites, setSites] = useState([]);
  const [health, setHealth] = useState(null);
  const [githubStatus, setGithubStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Keep track of unmounted state to prevent memory leaks
  const isMounted = useRef(true);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }

    try {
      // Concurrently query all 3 endpoints using axios
      const [sitesRes, healthRes, githubRes] = await Promise.all([
        axios.get(`${API_BASE}/sites`),
        axios.get(`${API_BASE}/health`),
        axios.get(`${API_BASE}/github-status`)
      ]);

      if (!isMounted.current) return;

      setSites(sitesRes.data || []);
      setHealth(healthRes.data || null);
      setGithubStatus(githubRes.data || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!isMounted.current) return;
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to monitoring backend');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    // Initial fetch
    fetchData(true);

    // Poll every 30 seconds
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [fetchData]);

  return {
    sites,
    health,
    githubStatus,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchData(false)
  };
}

export default useDashboardData;
