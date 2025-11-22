import React, { useState } from 'react';
import { Template, Workflow, Variable } from '../types';
import { Play, Plus, Sparkles, Trash2, FileText, Loader2, Pencil, X, ArrowRight } from 'lucide-react';
import { generateTemplateWithAI } from '../services/geminiService';

interface DashboardProps {
  templates: Template[];
  activeWorkflows: Workflow[];
  onStartWorkflow: (template: Template, initialVariables?: Variable[]) => void;
  onResumeWorkflow: (workflow: Workflow) => void;
  onAddTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  templates,
  activeWorkflows,
  onStartWorkflow,
  onResumeWorkflow,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDeleteWorkflow
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Start Workflow Modal State
  const [startTemplate, setStartTemplate] = useState<Template | null>(null);
  const [startVariables, setStartVariables] = useState<Variable[]>([]);

  // Helper to ensure safe strings for rendering
  const safeStr = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '';
    return String(val);
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newTemplate = await generateTemplateWithAI(aiPrompt);
      onAddTemplate(newTemplate);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (e) {
      alert("Failed to generate template. Ensure your API key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const initiateStartWorkflow = (template: Template) => {
    if (template.defaultVariables.length === 0) {
      // No variables to setup, start immediately
      onStartWorkflow(template);
    } else {
      // Open setup modal
      setStartTemplate(template);
      setStartVariables(template.defaultVariables.map(v => ({ ...v })));
    }
  };

  const confirmStartWorkflow = () => {
    if (startTemplate) {
      onStartWorkflow(startTemplate, startVariables);
      setStartTemplate(null);
      setStartVariables([]);
    }
  };

  const updateStartVariable = (index: number, value: string) => {
    const newVars = [...startVariables];
    newVars[index] = { ...newVars[index], value };
    setStartVariables(newVars);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">FlowState</h1>
          <p className="text-gray-500 mt-1">Manage your procedures with shared context.</p>
        </div>
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Sparkles size={18} />
          <span>New AI Template</span>
        </button>
      </div>

      {/* Start Workflow Modal */}
      {startTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Setup {safeStr(startTemplate.name) || 'Workflow'}</h3>
              <button onClick={() => setStartTemplate(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Initialize your context variables before starting. These values will be available in every step.
              </p>
              {startVariables.map((v, idx) => {
                const safeKey = safeStr(v.key) || idx.toString();
                const safeLabel = safeStr(v.label) || 'Variable';
                const safeVal = safeStr(v.value);
                const safeDesc = safeStr(v.description);
                
                return (
                  <div key={safeKey}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {safeLabel}
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      placeholder={safeDesc || `Enter value`}
                      value={safeVal}
                      onChange={(e) => updateStartVariable(idx, e.target.value)}
                      autoFocus={idx === 0}
                    />
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3">
              <button 
                onClick={() => setStartTemplate(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={confirmStartWorkflow}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
              >
                Start Run <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center gap-3">
              <Sparkles className="text-brand-600" size={20} />
              <h3 className="font-semibold text-brand-900">Generate Workflow with AI</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Describe what you want to achieve (e.g., "Launch a new podcast episode", "Onboard a new employee").
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none h-32"
                placeholder="E.g. I need a workflow to plan and execute a webinar, including landing page setup and zoom creation..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowAiModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !aiPrompt}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : null}
                  {isGenerating ? "Generating..." : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Workflows Section */}
      {activeWorkflows.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Play size={20} className="text-green-600" /> In Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeWorkflows.map((wf) => (
              <div key={wf.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">Running</span>
                  <button onClick={() => onDeleteWorkflow(wf.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Defensive render for template name */}
                <h3 className="font-bold text-gray-900 truncate">
                  {safeStr(wf.templateName) || 'Untitled Workflow'}
                </h3>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${((wf.currentStepIndex) / Math.max(wf.steps.length, 1)) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Step {wf.currentStepIndex + 1} of {wf.steps.length}</p>
                <button
                  onClick={() => onResumeWorkflow(wf)}
                  className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Templates Section */}
      <section>
         <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={20} className="text-brand-600" /> Available Templates
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-brand-300 transition-all relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEditTemplate(t)}
                  className="text-gray-300 hover:text-brand-500 transition-colors p-1"
                  title="Edit Template"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => onDeleteTemplate(t.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Delete Template"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-2 pr-16">{safeStr(t.name) || 'Template'}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{safeStr(t.description)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                <span className="bg-gray-100 px-2 py-1 rounded">{t.steps.length} Steps</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{t.defaultVariables.length} Variables</span>
              </div>
              <button
                onClick={() => initiateStartWorkflow(t)}
                className="w-full py-2 border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Start New Run
              </button>
            </div>
          ))}
          
          {/* Create Manual Template Placeholder */}
          <div 
            onClick={() => setShowAiModal(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 cursor-pointer transition-all min-h-[200px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Create Template</span>
          </div>
        </div>
      </section>
    </div>
  );
};