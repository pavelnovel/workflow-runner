import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { fetchTemplate } from '@/api/templates';
import { queryKeys } from '@/api/queryKeys';

export function TemplateDetail() {
  const params = useParams();
  const templateId = Number(params.templateId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => fetchTemplate(templateId),
    enabled: Number.isFinite(templateId)
  });

  if (!Number.isFinite(templateId)) {
    return <div className="card">Invalid template id</div>;
  }

  if (isLoading) {
    return <div className="card">Loading template…</div>;
  }

  if (isError) {
    return <div className="card">Error: {error.message}</div>;
  }

  return (
    <section className="card stack">
      <header>
        <h1>{data?.name}</h1>
        <p style={{ color: '#4b5563' }}>{data?.description}</p>
      </header>
      <div>
        <h3>Steps</h3>
        <ol>
          {data?.steps.map((step) => (
            <li key={step.id} style={{ marginBottom: '1rem' }}>
              <strong>
                {step.order_index}. {step.title}
              </strong>
              {step.description && <p style={{ margin: '0.25rem 0' }}>{step.description}</p>}
              {step.field_defs.length > 0 && (
                <ul>
                  {step.field_defs.map((field) => (
                    <li key={field.id}>
                      {field.label} ({field.type}) {field.required ? '*' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

