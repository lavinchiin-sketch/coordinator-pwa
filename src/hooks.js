import { useEffect, useState, useRef } from 'react';

// Shared paginated-list pattern used by every list page (Students, Tasks, Attendance
// logs, Complaints, Documents, Placements, Users...). Replaces a bug that existed
// in earlier drafts: two separate effects (one resetting the page on filter change,
// one reacting to page change) fired a duplicate request whenever a filter changed
// while not on page 1. Here, a filter change always fetches page 1 exactly once;
// only an explicit page change fetches again.
export function usePagedList(fetchFn, filters = {}) {
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const filtersKey = JSON.stringify(filters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    let cancelled = false;
    setPage(1);
    fetchFn({ ...filtersRef.current, page: 1 })
      .then((d) => { if (!cancelled) { setList(d); setError(''); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    if (page === 1) return; // already fetched by the effect above
    let cancelled = false;
    fetchFn({ ...filtersRef.current, page })
      .then((d) => { if (!cancelled) { setList(d); setError(''); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function reload() {
    return fetchFn({ ...filtersRef.current, page })
      .then((d) => { setList(d); setError(''); })
      .catch((e) => setError(e.message));
  }

  return { list, page, setPage, error, setError, reload };
}
