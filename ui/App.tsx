import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { TemplateLibrary } from './components/TemplateLibrary';
import { ActiveProcesses } from './components/ActiveProcesses';
import { WorkflowRun } from './components/WorkflowRun';
import { TemplateEditor } from './components/TemplateEditor';
import { Settings } from './components/Settings';
import { Template, Workflow, ViewState, Variable } from './types';
import { apiService } from './services/apiService';

// Initial mock data to make the app usable immediately
const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Launch New Live Webinar',
    description: 'Setup Zoom, HubSpot, WordPress landing page, and emails.',
    defaultVariables: [
      { key: 'webinarTitle', label: 'Webinar Title', value: '', description: 'The public facing name' },
      { key: 'date', label: 'Date & Time', value: '', description: 'When is it happening?' },
      { key: 'speakerName', label: 'Speaker Name', value: '', description: 'Who is presenting?' }
    ],
    steps: [
      { id: 's1', title: 'Define Topic & Strategy', description: 'Decide on the core topic for {{webinarTitle}}. Ensure it aligns with the quarterly goals.', completed: false },
      { id: 's2', title: 'Create Zoom Meeting', description: 'Go to Zoom and schedule a meeting for {{date}}. Copy the join link.', completed: false },
      { id: 's3', title: 'Build Landing Page', description: 'Create a landing page using the title: {{webinarTitle}}.', completed: false },
      { id: 's4', title: 'Setup Email Sequence', description: 'Create registration confirmation and reminder emails in HubSpot.', completed: false },
      { id: 's5', title: 'Create Social Posts', description: 'Draft promotional posts for LinkedIn and Twitter.', completed: false },
      { id: 's6', title: 'Schedule Promotion', description: 'Schedule email blast and social posts for {{date}}.', completed: false },
      { id: 's7', title: 'Final Review', description: 'Test all links, review landing page, and confirm speaker {{speakerName}} is ready.', completed: false }
    ]
  },
  {
    id: 't2',
    name: 'High Intent Page Checkup',
    description: 'Bi-weekly health check for pricing page workflow.',
    isRecurring: true,
    recurrenceInterval: 'biweekly',
    defaultVariables: [],
    steps: [
      { id: 's1', title: 'Check Page Load Speed', description: 'Use PageSpeed Insights to verify load time under 3 seconds.', completed: false },
      { id: 's2', title: 'Verify All CTAs Work', description: 'Click every button and link on the pricing page.', completed: false },
      { id: 's3', title: 'Review Analytics', description: 'Check conversion rate and bounce rate in Google Analytics.', completed: false },
      { id: 's4', title: 'Test Checkout Flow', description: 'Complete a test purchase to verify payment flow.', completed: false },
      { id: 's5', title: 'Document Issues', description: 'Log any issues found and assign to the appropriate team.', completed: false }
    ]
  },
  {
    id: 't3',
    name: 'Setup New Community Space',
    description: 'Launch a new Circle.so space and invite members.',
    defaultVariables: [
      { key: 'spaceName', label: 'Space Name', value: '', description: 'Name of the new community space' },
      { key: 'description', label: 'Description', value: '', description: 'What is this space for?' }
    ],
    steps: [
      { id: 's1', title: 'Create Space in Circle', description: 'Log into Circle.so and create a new space called {{spaceName}}.', completed: false },
      { id: 's2', title: 'Configure Settings', description: 'Set privacy, notification preferences, and moderation rules.', completed: false },
      { id: 's3', title: 'Add Welcome Post', description: 'Create an introductory post explaining {{description}}.', completed: false },
      { id: 's4', title: 'Invite Initial Members', description: 'Send invitations to founding members of the space.', completed: false },
      { id: 's5', title: 'Announce Launch', description: 'Share the new space in the main community feed.', completed: false }
    ]
  },
  {
    id: 't4',
    name: 'Customer Onboarding Handover',
    description: 'Sales to CS handover process.',
    defaultVariables: [
      { key: 'customerName', label: 'Customer Name', value: '', description: 'Name of the customer' },
      { key: 'dealValue', label: 'Deal Value', value: '', description: 'Contract value' }
    ],
    steps: [
      { id: 's1', title: 'Complete Sales Notes', description: 'Document all requirements and expectations for {{customerName}}.', completed: false },
      { id: 's2', title: 'Schedule Handover Call', description: 'Set up internal call between Sales and CS team.', completed: false },
      { id: 's3', title: 'Transfer Account Ownership', description: 'Update CRM to assign {{customerName}} to CS rep.', completed: false },
      { id: 's4', title: 'Send Welcome Package', description: 'Trigger onboarding email sequence for the customer.', completed: false }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to ensure data integrity (prevent objects where strings are expected)
  const safeStr = (v: any) => {
    if (v === null || v === undefined) return '';
    return typeof v === 'object' ? '' : String(v);
  };

  // Load from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, workflowsData] = await Promise.all([
          apiService.getTemplates(),
          apiService.getWorkflows()
        ]);
        // Always set templates from backend (even if empty) to reflect true state
        setTemplates(templatesData);
        setActiveWorkflows(workflowsData);
      } catch (error) {
        console.error("Failed to load data from backend:", error);
        // Fallback to initial templates on error - keep INITIAL_TEMPLATES (already set as default)
        // No action needed since useState already initialized with INITIAL_TEMPLATES
      }
    };

    loadData();
  }, []);

  const handleStartWorkflow = async (template: Template, initialVariables?: Variable[]) => {
    try {
      const newWorkflow = await apiService.createWorkflow(
        template.id,
        initialVariables || template.defaultVariables
      );
      // Add template metadata to workflow for display
      const enrichedWorkflow: Workflow = {
        ...newWorkflow,
        isRecurring: template.isRecurring,
        recurrenceInterval: template.recurrenceInterval
      };
      setActiveWorkflows([enrichedWorkflow, ...activeWorkflows]);
      setCurrentWorkflowId(enrichedWorkflow.id);
      setView('RUNNER');
    } catch (error) {
      console.error("Failed to start workflow:", error);
      alert("Failed to start workflow. Please check backend connection.");
    }
  };

  const handleResumeWorkflow = async (workflow: Workflow) => {
    try {
      // Fetch fresh workflow data with step statuses
      const freshWorkflow = await apiService.getWorkflow(workflow.id);
      // Preserve our UI-specific fields
      const enrichedWorkflow: Workflow = {
        ...freshWorkflow,
        isRecurring: workflow.isRecurring,
        recurrenceInterval: workflow.recurrenceInterval
      };
      setActiveWorkflows(prev => prev.map(w => w.id === workflow.id ? enrichedWorkflow : w));
      setCurrentWorkflowId(workflow.id);
      setView('RUNNER');
    } catch (error) {
      console.error("Failed to load workflow details:", error);
      // Fallback to cached data
      setCurrentWorkflowId(workflow.id);
      setView('RUNNER');
    }
  };

  const handleUpdateWorkflow = async (updated: Workflow) => {
    try {
      const updatedWorkflow = await apiService.updateWorkflow(updated.id, updated);
      // Template metadata (templateIcon, isRecurring, recurrenceInterval) is now properly populated by workflowFromBackend
      setActiveWorkflows(prev => prev.map(w => w.id === updated.id ? updatedWorkflow : w));
    } catch (error) {
      console.error("Failed to update workflow:", error);
      setActiveWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    }
  };

  const handleAddTemplate = async (template: Template) => {
    try {
      const newTemplate = await apiService.createTemplate(template);
      setTemplates([newTemplate, ...templates]);
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template. Please check backend connection.");
    }
  };

  const handleEditTemplate = (template: Template) => {
    const isRecurring = Boolean(template.isRecurring);
    const cleanTemplate: Template = {
      id: safeStr(template.id),
      name: safeStr(template.name),
      description: safeStr(template.description),
      isRecurring,
      // Only set recurrenceInterval when isRecurring is true to maintain data consistency
      recurrenceInterval: isRecurring ? (template.recurrenceInterval || 'biweekly') : undefined,
      defaultVariables: (Array.isArray(template.defaultVariables) ? template.defaultVariables : [])
        .filter(v => v && typeof v === 'object' && !Array.isArray(v))
        .map(v => ({
          key: safeStr(v?.key),
          label: safeStr(v?.label),
          value: safeStr(v?.value),
          description: safeStr(v?.description)
        })),
      steps: (Array.isArray(template.steps) ? template.steps : [])
        .filter(s => s && typeof s === 'object' && !Array.isArray(s))
        .map(s => ({
          id: safeStr(s?.id) || `step_${Math.random()}`,
          title: safeStr(s?.title),
          description: safeStr(s?.description),
          completed: Boolean(s?.completed)
        }))
    };
    setEditingTemplate(cleanTemplate);
    setView('EDIT_TEMPLATE');
  };

  const handleSaveTemplate = async (updatedTemplate: Template) => {
    try {
      const saved = await apiService.updateTemplate(updatedTemplate.id, updatedTemplate);
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? saved : t));
      setEditingTemplate(null);
      setView('TEMPLATES');
    } catch (error) {
      console.error("Failed to save template:", error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure? This will not affect running workflows.')) {
      try {
        await apiService.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error("Failed to delete template:", error);
        alert("Failed to delete template. Please check backend connection.");
      }
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('Delete this run?')) {
      try {
        await apiService.deleteWorkflow(id);
        setActiveWorkflows(prev => prev.filter(w => w.id !== id));
      } catch (error) {
        console.error("Failed to delete workflow:", error);
        alert("Failed to delete workflow. Please check backend connection.");
      }
    }
  };

  const handleNavigate = (newView: ViewState) => {
    setView(newView);
    setSearchQuery(''); // Reset search when navigating
  };

  const currentWorkflow = activeWorkflows.find(w => w.id === currentWorkflowId);

  // Get page title based on current view
  const getPageTitle = () => {
    switch (view) {
      case 'DASHBOARD': return 'Overview';
      case 'ACTIVE_PROCESSES': return 'Runs';
      case 'TEMPLATES': return 'Workflows';
      case 'SETTINGS': return 'Settings';
      default: return 'Workflow Runner';
    }
  };

  // Render content based on view - Runner and Editor are full-screen, others use Layout
  if (view === 'RUNNER' && currentWorkflow) {
    return (
      <WorkflowRun
        workflow={currentWorkflow}
        onUpdate={handleUpdateWorkflow}
        onBack={() => setView('ACTIVE_PROCESSES')}
      />
    );
  }

  if (view === 'EDIT_TEMPLATE' && editingTemplate) {
    return (
      <TemplateEditor
        initialTemplate={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => setView('TEMPLATES')}
      />
    );
  }

  return (
    <Layout
      currentView={view}
      onNavigate={handleNavigate}
      title={getPageTitle()}
      showSearch={view !== 'DASHBOARD' && view !== 'SETTINGS'}
      onSearch={setSearchQuery}
      searchPlaceholder={view === 'TEMPLATES' ? 'Search workflows...' : 'Search runs...'}
    >
      {view === 'DASHBOARD' && (
        <HomePage
          templates={templates}
          activeWorkflows={activeWorkflows}
          onResumeWorkflow={handleResumeWorkflow}
          onNavigateToProcesses={() => setView('ACTIVE_PROCESSES')}
        />
      )}

      {view === 'ACTIVE_PROCESSES' && (
        <ActiveProcesses
          workflows={activeWorkflows}
          onResumeWorkflow={handleResumeWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          searchQuery={searchQuery}
        />
      )}

      {view === 'TEMPLATES' && (
        <TemplateLibrary
          templates={templates}
          onStartWorkflow={handleStartWorkflow}
          onAddTemplate={handleAddTemplate}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          searchQuery={searchQuery}
        />
      )}

      {view === 'SETTINGS' && (
        <Settings />
      )}
    </Layout>
  );
};

export default App;
