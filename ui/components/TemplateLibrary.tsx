import React, { useState } from 'react';
import { Template, Variable } from '../types';
import { Play, Plus, Sparkles, Trash2, Pencil, X, ArrowRight, Loader2, RefreshCw, FileText } from 'lucide-react';
import { generateTemplateWithAI } from '../services/geminiService';

interface TemplateLibraryProps {
  templates: Template[];
  onStartWorkflow: (template: Template, initialVariables?: Variable[]) => void;
  onAddTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  searchQuery?: string;
}

// Helper to ensure safe strings for rendering
const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

// Color palette for templates
const templateColors = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
  'bg-cyan-100 text-cyan-600',
  'bg-indigo-100 text-indigo-600',
  'bg-amber-100 text-amber-600'
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onStartWorkflow,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  searchQuery = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Start Workflow Modal State
  const [startTemplate, setStartTemplate] = useState<Template | null>(null);
  const [startVariables, setStartVariables] = useState<Variable[]>([]);

  // Filter templates based on search query
  const filteredTemplates = templates.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      safeStr(t.name).toLowerCase().includes(query) ||
      safeStr(t.description).toLowerCase().includes(query)
    );
  });

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newTemplate = await generateTemplateWithAI(aiPrompt);
      onAddTemplate(newTemplate);
      setShowAiModal(false);
      setAiPrompt('');
    } catch {
      alert("Failed to generate template. Ensure your API key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const initiateStartWorkflow = (template: Template) => {
    if (template.defaultVariables.length === 0) {
      onStartWorkflow(template);
    } else {
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

  // Get color class for template based on index
  const getTemplateColor = (index: number): string => {
    return templateColors[index % templateColors.length];
  };

  return (
    <div className="space-y-6">
      {/* Start Workflow Modal */}
      {startTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Setup {safeStr(startTemplate.name) || 'Workflow'}</h3>
              <button onClick={() => setStartTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
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
                  {isGenerating ? "Generating..." : "Create Workflow"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-300 hover:shadow-md transition-all relative group"
          >
            {/* Template Label */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTemplateColor(index)}`}>
                  <FileText size={20} />
                </div>
                {/* Edit/Delete buttons - show on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditTemplate(template)}
                    className="text-gray-300 hover:text-brand-500 transition-colors p-1"
                    title="Edit Workflow"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Delete Workflow"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Workflow</span>
            </div>

            {/* Content */}
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              {safeStr(template.name) || 'Untitled Workflow'}
            </h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">
              {safeStr(template.description) || 'No description'}
            </p>

            {/* Recurrence badge */}
            {template.isRecurring && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                <RefreshCw size={12} />
                <span className="capitalize">{template.recurrenceInterval}</span>
              </div>
            )}

            {/* Steps count */}
            <p className="text-sm text-gray-400 mb-4">
              {template.steps.length} steps defined
            </p>

            {/* Launch Button */}
            <button
              onClick={() => initiateStartWorkflow(template)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Start Run
            </button>
          </div>
        ))}

        {/* Create Template Card */}
        <div
          onClick={() => setShowAiModal(true)}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 cursor-pointer transition-all min-h-[280px]"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus size={28} />
          </div>
          <span className="font-semibold text-lg">Create Workflow</span>
          <span className="text-sm mt-1">Use AI to generate a new workflow from scratch</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500">No workflows match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};
