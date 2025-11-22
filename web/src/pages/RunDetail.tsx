import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { fetchRun } from '@/api/runs';
import { queryKeys } from '@/api/queryKeys';

const statusColors: Record<string, string> = {
  not_started: '#9ca3af',
  in_progress: '#2563eb',
  blocked: '#ea580c',
  done: '#16a34a'
};

export function RunDetail() {
  const params = useParams();
  const runId = Number(params.runId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: () => fetchRun(runId),
    enabled: Number.isFinite(runId)
  });

  if (!Number.isFinite(runId)) {
    return <div className="card">Invalid run id</div>;
  }

  if (isLoading) {
    return <div className="card">Loading run…</div>;
  }

  if (isError) {
    return <div className="card">Error: {error.message}</div>;
  }

  return (
    <section className="card stack">
      <header>
        <h1>{data?.name}</h1>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            background: statusColors[data?.status ?? 'not_started'] ?? '#9ca3af',
            color: 'white'
          }}
        >
          {data?.status}
        </span>
      </header>
      <div className="stack">
        {data?.steps?.map((step) => (
          <article key={step.id} className="card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
            <header>
              <strong>
                {step.order_index}. {step.template_step?.title ?? 'Step'}
              </strong>
            </header>
            <p>Status: {step.status}</p>
            {step.notes && <p>Notes: {step.notes}</p>}
            {step.field_values.length > 0 && (
              <ul>
                {step.field_values.map((value) => (
                  <li key={value.id}>
                    Field {value.field_def_id}: {JSON.stringify(value.value)}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

