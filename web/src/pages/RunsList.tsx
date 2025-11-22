import { useQuery } from '@tanstack/react-query';

import { fetchRuns } from '@/api/runs';
import { queryKeys } from '@/api/queryKeys';

export function RunsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.runs(),
    queryFn: () => fetchRuns()
  });

  if (isLoading) {
    return <div className="card">Loading runs…</div>;
  }

  if (isError) {
    return <div className="card">Error: {error.message}</div>;
  }

  return (
    <section className="card stack">
      <header>
        <h1>Runs</h1>
        <p>{data?.length ?? 0} active</p>
      </header>
      {data?.map((run) => (
        <div className="list-row" key={run.id}>
          <div>
            <h3 style={{ margin: 0 }}>{run.name}</h3>
            <p style={{ margin: '0.25rem 0', color: '#4b5563' }}>Status: {run.status}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

