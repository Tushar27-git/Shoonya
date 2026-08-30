import { useState, useEffect } from 'react';
import { shoonyaApi } from '../api/shoonyaApi';

export function useDashboardState() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchState = async () => {
      try {
        const data = await shoonyaApi.getDashboardState();
        if (isMounted) {
          setState(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchState(); // Initial fetch
    
    const interval = setInterval(fetchState, 2000); // 2-second polling
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { state, loading, error };
}
