import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export function useDashboardData() {
  const [sites, setSites] = useState([]);
  const [health, setHealth] = useState(null);
  const [githubStatus, setGithubStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const performFetch = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mounted.current) setLoading(true);
    try {
      const results = await Promise.allSettled(['sites', 'health', 'github-status'].map(route => axios.get(`${API_BASE}/${route}`, { timeout: 45000 })));
      if (!mounted.current) return;
      const [s, h, g] = results;
      if (s.status === 'fulfilled' && Array.isArray(s.value.data)) { setSites(s.value.data); setLastUpdated(new Date()); } else setSites([]);
      setHealth(h.status === 'fulfilled' ? h.value.data : null);
      setGithubStatus(g.status === 'fulfilled' && Array.isArray(g.value.data) ? g.value.data : []);
      const failures = results.flatMap((r, i) => r.status === 'rejected' ? [['Service checks', 'System metrics', 'GitHub data'][i]] : []);
      setError(failures.length ? `${failures.join(', ')} unavailable. Retry to fetch current data.` : null);
    } finally { inFlight.current = false; if (mounted.current) setLoading(false); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(performFetch, 0);
    const interval = setInterval(performFetch, 30000);
    return () => { mounted.current = false; clearTimeout(initial); clearInterval(interval); };
  }, [performFetch]);
  return { sites, health, githubStatus, loading, error, lastUpdated, refetch: performFetch };
}
export default useDashboardData;
