import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { fetchTemplates } from '@/api/templates';
import { queryKeys } from '@/api/queryKeys';

export function TemplatesList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.templates,
    queryFn: fetchTemplates
  });

  if (isLoading) {
    return <div className="card">Loading templates…</div>;
  }

  if (isError) {
    return <div className="card">Error: {error.message}</div>;
  }

  return (
    <section className="card stack">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Templates</h1>
          <p>{data?.length ?? 0} total</p>
        </div>
        <Link className="btn" to="/templates/new">
          + New Template
        </Link>
      </header>
      {data?.map((template) => (
        <div className="list-row" key={template.id}>
          <div>
            <h3 style={{ margin: 0 }}>{template.name}</h3>
            <p style={{ margin: '0.25rem 0', color: '#4b5563' }}>{template.description}</p>
          </div>
          <Link className="btn" to={`/templates/${template.id}`}>
            View
          </Link>
        </div>
      ))}
    </section>
  );
}

