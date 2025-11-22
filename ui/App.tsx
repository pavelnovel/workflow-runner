import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkflowRun } from './components/WorkflowRun';
import { TemplateEditor } from './components/TemplateEditor';
import { Template, Workflow, ViewState, Variable } from './types';
import { Trash2 } from 'lucide-react';
import { apiService } from './services/apiService';

// Initial mock data to make the app usable immediately
const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Host a Webinar',
    description: 'End-to-end process for creating, promoting, and hosting a webinar using Zoom and email marketing.',
    defaultVariables: [
      { key: 'webinarTitle', label: 'Webinar Title', value: '', description: 'The public facing name' },
      { key: 'date', label: 'Date & Time', value: '', description: 'When is it happening?' },
      { key: 'speakerName', label: 'Speaker Name', value: '', description: 'Who is presenting?' }
    ],
    steps: [
      { id: 's1', title: 'Define Topic & Strategy', description: 'Decide on the core topic for {{webinarTitle}}. Ensure it aligns with the quarterly goals for {{speakerName}}.', completed: false },
      { id: 's2', title: 'Create Zoom Meeting', description: 'Go to Zoom and schedule a meeting for {{date}}. Copy the join link and add it to the variables panel on the right.', completed: false },
      { id: 's3', title: 'Build Landing Page', description: 'Create a landing page using the title: {{webinarTitle}}. Paste the Zoom link from your context variables into the CTA button.', completed: false },
      { id: 's4', title: 'Send Invitations', description: 'Send email blast inviting users to {{webinarTitle}} on {{date}}.', completed: false }
    ]
  },
  {
    id: 't2',
    name: 'Employee Onboarding',
    description: 'Standard procedure for welcoming a new team member and setting up their accounts.',
    defaultVariables: [
      { key: 'employeeName', label: 'Employee Name', value: '' },
      { key: 'role', label: 'Role', value: '' },
      { key: 'email', label: 'Company Email', value: '' }
    ],
    steps: [
      { id: 's1', title: 'HR Paperwork', description: 'Ensure {{employeeName}} has signed the offer letter and NDA.', completed: false },
      { id: 's2', title: 'IT Setup', description: 'Provision a laptop and create the email account: {{email}}.', completed: false },
      { id: 's3', title: 'Team Intro', description: 'Schedule a 30min intro meeting with the team for {{employeeName}} ({{role}}).', completed: false }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Helper to ensure data integrity (prevent objects where strings are expected)
  const safeStr = (v: any) => {
      if (v === null || v === undefined) return '';
      // If it's an object, force to string to prevent crashes, even if it looks ugly like [object Object]
      // Ideally we return '' if it's a complex object but String() is the ultimate fallback against Crash #31
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
        setTemplates(templatesData);
        setActiveWorkflows(workflowsData);
      } catch (error) {
        console.error("Failed to load data from backend:", error);
        // Fallback to initial templates on error
        setTemplates(INITIAL_TEMPLATES);
      }
    };

    loadData();
  }, []);

  // Note: Data is now persisted to backend API automatically via CRUD operations

  const handleStartWorkflow = async (template: Template, initialVariables?: Variable[]) => {
    try {
      const newWorkflow = await apiService.createWorkflow(
        template.id,
        initialVariables || template.defaultVariables
      );
      setActiveWorkflows([newWorkflow, ...activeWorkflows]);
      setCurrentWorkflowId(newWorkflow.id);
      setView('RUNNER');
    } catch (error) {
      console.error("Failed to start workflow:", error);
      alert("Failed to start workflow. Please check backend connection.");
    }
  };

  const handleResumeWorkflow = (workflow: Workflow) => {
    setCurrentWorkflowId(workflow.id);
    setView('RUNNER');
  };

  const handleUpdateWorkflow = async (updated: Workflow) => {
    try {
      const updatedWorkflow = await apiService.updateWorkflow(updated.id, updated);
      setActiveWorkflows(prev => prev.map(w => w.id === updated.id ? updatedWorkflow : w));
    } catch (error) {
      console.error("Failed to update workflow:", error);
      // Still update local state for better UX
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
    // Strict reconstruction to ensure no hidden objects are passed to the editor
    const cleanTemplate: Template = {
        id: safeStr(template.id),
        name: safeStr(template.name),
        description: safeStr(template.description),
        defaultVariables: (Array.isArray(template.defaultVariables) ? template.defaultVariables : []).map(v => ({
            key: safeStr(v?.key),
            label: safeStr(v?.label),
            value: safeStr(v?.value),
            description: safeStr(v?.description)
        })),
        steps: (Array.isArray(template.steps) ? template.steps : []).map(s => ({
            id: safeStr(s?.id),
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
      setView('DASHBOARD');
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please check backend connection.");
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

  const handleResetData = () => {
    if (confirm("Are you sure you want to clear all data and reset the app? This will DELETE ALL TEMPLATES AND WORKFLOWS from the database!")) {
      alert("Please use the backend API or database tools to reset data. This button is disabled for safety.");
    }
  };

  const currentWorkflow = activeWorkflows.find(w => w.id === currentWorkflowId);

  return (
    <div className="min-h-screen font-sans text-slate-900 flex flex-col">
      <div className="flex-1">
        {view === 'DASHBOARD' && (
          <Dashboard
            templates={templates}
            activeWorkflows={activeWorkflows}
            onStartWorkflow={handleStartWorkflow}
            onResumeWorkflow={handleResumeWorkflow}
            onAddTemplate={handleAddTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onDeleteWorkflow={handleDeleteWorkflow}
          />
        )}

        {view === 'RUNNER' && currentWorkflow && (
          <WorkflowRun
            workflow={currentWorkflow}
            onUpdate={handleUpdateWorkflow}
            onBack={() => setView('DASHBOARD')}
          />
        )}

        {view === 'EDIT_TEMPLATE' && editingTemplate && (
          <TemplateEditor
            initialTemplate={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setView('DASHBOARD')}
          />
        )}
      </div>
      
      {view === 'DASHBOARD' && (
        <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
          <p className="mb-2">FlowState v1.0</p>
          <button 
            onClick={handleResetData}
            className="text-red-400 hover:text-red-600 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <Trash2 size={12} /> Reset All Data
          </button>
        </footer>
      )}
    </div>
  );
};

export default App;