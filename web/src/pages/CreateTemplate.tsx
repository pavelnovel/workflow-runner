import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTemplate, CreateTemplatePayload } from '@/api/templates';
import { queryKeys } from '@/api/queryKeys';

export function CreateTemplate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      navigate(`/templates/${data.id}`);
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: CreateTemplatePayload = { name };
    if (description) {
      payload.description = description;
    }
    mutation.mutate(payload);
  };

  return (
    <section className="card">
      <h1>Create New Template</h1>
      <form onSubmit={handleSubmit} className="stack">
        <div>
          <label htmlFor="name">
            Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Employee Onboarding"
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what this template is for..."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Template'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/')}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
        </div>

        {mutation.isError && (
          <div style={{ color: 'red' }}>
            Error: {mutation.error?.message || 'Failed to create template'}
          </div>
        )}
      </form>
    </section>
  );
}

