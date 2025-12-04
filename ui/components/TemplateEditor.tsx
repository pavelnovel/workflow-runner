import React, { useState } from 'react';
import { Template, Variable, Step, RecurrenceInterval } from '../types';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Loader2, RefreshCw } from 'lucide-react';

// Available emoji icons for templates
const TEMPLATE_ICONS = ['📋', '🎥', '🛡️', '👥', '🤝', '📊', '🚀', '💼', '📝', '🎯', '🔧', '📦', '💡', '📈', '🎉', '⚡'];

interface TemplateEditorProps {
  initialTemplate: Template;
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ initialTemplate, onSave, onCancel }) => {
  // Sanitize template on load to prevent object rendering errors
  const sanitizeTemplate = (t: Template): Template => {
    return {
      ...t,
      name: typeof t.name === 'string' ? t.name : '',
      description: typeof t.description === 'string' ? t.description : '',
      icon: typeof t.icon === 'string' ? t.icon : '📋',
      isRecurring: Boolean(t.isRecurring),
      recurrenceInterval: t.recurrenceInterval || 'biweekly',
      defaultVariables: Array.isArray(t.defaultVariables)
        ? t.defaultVariables.map(v => ({
            key: typeof v?.key === 'string' ? v.key : '',
            label: typeof v?.label === 'string' ? v.label : '',
            value: typeof v?.value === 'string' ? v.value : '',
            description: typeof v?.description === 'string' ? v.description : ''
          }))
        : [],
      steps: Array.isArray(t.steps)
        ? t.steps.map(s => ({
            id: typeof s?.id === 'string' ? s.id : String(Math.random()),
            title: typeof s?.title === 'string' ? s.title : '',
            description: typeof s?.description === 'string' ? s.description : '',
            completed: Boolean(s?.completed)
          }))
        : []
    };
  };

  const [template, setTemplate] = useState<Template>(sanitizeTemplate(initialTemplate));
  const [activeTab, setActiveTab] = useState<'general' | 'variables' | 'steps'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to ensure string and completely discard objects
  const safeVal = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return ''; // Aggressively discard objects to prevent Error #31
    return String(val);
  };

  const handleBasicChange = (field: 'name' | 'description', value: string) => {
    setTemplate({ ...template, [field]: value });
  };

  // --- Variable Management ---
  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    const newVars = [...(template.defaultVariables || [])];
    // Ensure the variable object exists before updating
    if (!newVars[index]) return;

    // Strictly ensure the value is a string
    const stringValue = typeof value === 'string' ? value : String(value || '');
    newVars[index] = {
      ...newVars[index],
      [field]: stringValue
    };
    setTemplate({ ...template, defaultVariables: newVars });
  };

  const addVariable = () => {
    const newVar: Variable = {
      key: `var_${Date.now()}`,
      label: 'New Variable',
      value: '',
      description: ''
    };
    const updatedVars = [...(template.defaultVariables || []), newVar];
    console.log('Adding new variable:', newVar);
    console.log('Updated variables array:', updatedVars);
    setTemplate({ ...template, defaultVariables: updatedVars });
  };

  const removeVariable = (index: number) => {
    const newVars = (template.defaultVariables || []).filter((_, i) => i !== index);
    setTemplate({ ...template, defaultVariables: newVars });
  };

  // --- Step Management ---
  const updateStep = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...(template.steps || [])];
    if (!newSteps[index]) return;
    newSteps[index] = { ...newSteps[index], [field]: value };
    setTemplate({ ...template, steps: newSteps });
  };

  const addStep = () => {
    const newStep: Step = {
      id: `step_${Date.now()}`,
      title: 'New Step',
      description: 'Describe the step here...',
      completed: false
    };
    setTemplate({ ...template, steps: [...(template.steps || []), newStep] });
  };

  const removeStep = (index: number) => {
    const newSteps = (template.steps || []).filter((_, i) => i !== index);
    setTemplate({ ...template, steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const currentSteps = template.steps || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentSteps.length - 1) return;

    const newSteps = [...currentSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setTemplate({ ...template, steps: newSteps });
  };

  const variableCount = Array.isArray(template.defaultVariables) ? template.defaultVariables.length : 0;
  const stepCount = Array.isArray(template.steps) ? template.steps.length : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(template);
    } catch (error) {
      console.error('Save error:', error);
      // Error is already shown by parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Edit Template</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          General Info
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'variables' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Variables ({variableCount})
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'steps' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Steps ({stepCount})
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full">
        
        {activeTab === 'general' && (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template Icon</label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setTemplate({ ...template, icon })}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      template.icon === icon
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                type="text"
                value={safeVal(template.name)}
                onChange={(e) => handleBasicChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={safeVal(template.description)}
                onChange={(e) => handleBasicChange('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              />
            </div>

            {/* Recurrence Settings */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw size={20} className="text-gray-500" />
                <h3 className="font-medium text-gray-900">Recurrence Settings</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.isRecurring || false}
                    onChange={(e) => setTemplate({ ...template, isRecurring: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">This is a recurring process</span>
                    <p className="text-xs text-gray-500">Enable to track when this process needs to be run again</p>
                  </div>
                </label>

                {template.isRecurring && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Run Frequency</label>
                    <select
                      value={template.recurrenceInterval || 'biweekly'}
                      onChange={(e) => setTemplate({ ...template, recurrenceInterval: e.target.value as RecurrenceInterval })}
                      className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly (every 2 weeks)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
               <p className="text-sm text-gray-500">Define data fields that should be captured at the start or during the workflow.</p>
               <button onClick={addVariable} className="text-sm flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                 <Plus size={16} /> Add Variable
               </button>
            </div>
            
            {Array.isArray(template.defaultVariables) && template.defaultVariables.map((variable, idx) => {
              if (!variable) return null;
              return (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start group">
                  <div className="mt-3 text-gray-300"><GripVertical size={20}/></div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={safeVal(variable.label)}
                        onChange={(e) => updateVariable(idx, 'label', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-brand-500 outline-none"
                        placeholder="e.g. Webinar Title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Key (used in {{}})</label>
                      <input
                        type="text"
                        value={safeVal(variable.key)}
                        onChange={(e) => updateVariable(idx, 'key', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono bg-gray-50 focus:border-brand-500 outline-none"
                        placeholder="e.g. webinarTitle"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Helper Text</label>
                      <input
                        type="text"
                        value={safeVal(variable.description)}
                        onChange={(e) => updateVariable(idx, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-brand-500 outline-none"
                        placeholder="Brief description for the user..."
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeVariable(idx)}
                    className="mt-1 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            {(!Array.isArray(template.defaultVariables) || template.defaultVariables.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                No variables defined.
              </div>
            )}
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-2">
               <p className="text-sm text-gray-500">Steps are executed sequentially. You can reference variables using <code>{`{{key}}`}</code>.</p>
               <button onClick={addStep} className="text-sm flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                 <Plus size={16} /> Add Step
               </button>
            </div>

            {Array.isArray(template.steps) && template.steps.map((step, idx) => {
              if (!step) return null;
              return (
                <div key={step.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1 pt-1">
                     <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                       {idx + 1}
                     </div>
                     
                     <div className="flex flex-col mt-2 gap-1">
                       <button 
                          onClick={() => moveStep(idx, 'up')} 
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-gray-100 rounded"
                        >
                          <ArrowUp size={14} />
                       </button>
                       <button 
                          onClick={() => moveStep(idx, 'down')} 
                          disabled={idx === (template.steps || []).length - 1}
                          className="p-1 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-gray-100 rounded"
                        >
                          <ArrowDown size={14} />
                       </button>
                     </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={safeVal(step.title)}
                      onChange={(e) => updateStep(idx, 'title', e.target.value)}
                      className="w-full text-lg font-semibold border-b border-transparent hover:border-gray-200 focus:border-brand-500 outline-none px-1"
                      placeholder="Step Title"
                    />
                    <textarea
                      value={safeVal(step.description)}
                      onChange={(e) => updateStep(idx, 'description', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-y min-h-[100px]"
                      placeholder="Step instructions... use {{variableKey}} to insert dynamic data."
                    />
                  </div>
                  <button 
                    onClick={() => removeStep(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            {(!Array.isArray(template.steps) || template.steps.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                No steps defined.
              </div>
            )}
            
             <button onClick={addStep} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-all font-medium flex items-center justify-center gap-2">
                 <Plus size={20} /> Add Next Step
            </button>
          </div>
        )}

      </main>
    </div>
  );
};