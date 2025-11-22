import { useRoutes } from 'react-router-dom';

import { TemplatesList } from '@/pages/TemplatesList';
import { CreateTemplate } from '@/pages/CreateTemplate';
import { TemplateDetail } from '@/pages/TemplateDetail';
import { RunsList } from '@/pages/RunsList';
import { RunDetail } from '@/pages/RunDetail';

const routes = [
  { path: '/', element: <TemplatesList /> },
  { path: '/templates/new', element: <CreateTemplate /> },
  { path: '/templates/:templateId', element: <TemplateDetail /> },
  { path: '/runs', element: <RunsList /> },
  { path: '/runs/:runId', element: <RunDetail /> }
];

export default function AppRoutes() {
  return useRoutes(routes);
}

