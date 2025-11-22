import React, { useState, useEffect, useMemo } from 'react';
import { Workflow, Variable, Step } from '../types';
import { ArrowLeft, CheckCircle, ChevronRight, Save, Plus, X, SlidersHorizontal } from 'lucide-react';

interface WorkflowRunProps {
  workflow: Workflow;
  onUpdate: (updatedWorkflow: Workflow) => void;
  onBack: () => void;
}

export const WorkflowRun: React.FC<WorkflowRunProps> = ({ workflow, onUpdate, onBack }) => {
  // Local state for variables to handle inputs before saving
  const [localVariables, setLocalVariables] = useState<Variable[]>(workflow.variables);
  const [isNewVarMode, setIsNewVarMode] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [showMobileVars, setShowMobileVars] = useState(false);

  // Sync local state if workflow changes externally (though mainly driving from here)
  useEffect(() => {
    setLocalVariables(workflow.variables);
  }, [workflow.variables]);

  const currentStep = workflow.steps[workflow.currentStepIndex];
  const isLastStep = workflow.currentStepIndex === workflow.steps.length - 1;

  // Helper to strictly force strings, no matter what garbage is passed in
  const strictString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return ''; // If object or array, return empty string to avoid crash
  };

  // Inject variables into text
  const renderTextWithVariables = (text: string) => {
    const safeText = strictString(text);
    if (!safeText) return null;
    
    const parts = safeText.split(/(\{\{.*?\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const variable = localVariables.find(v => v.key === key);
        
        // CRITICAL FIX: Ensure 'value' is primitive string before rendering
        const value = variable ? strictString(variable.value) : part;
        
        if (variable) {
          return (
             <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-brand-800 bg-brand-100 font-medium text-sm mx-0.5 border border-brand-200 select-all">
               {value}
             </span>
          );
        }
        return <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleVariableChange = (key: string, newValue: string) => {
    const updatedVars = localVariables.map(v => 
      v.key === key ? { ...v, value: newValue } : v
    );
    setLocalVariables(updatedVars);
    // Auto-save variables to workflow state
    onUpdate({ ...workflow, variables: updatedVars });
  };

  const handleAddVariable = () => {
    if (!newVarKey || !newVarValue) return;
    const newVar: Variable = {
      key: newVarKey.replace(/\s+/g, ''), // Simple key sanitization
      label: newVarKey,
      value: newVarValue,
      description: 'Added during run'
    };
    const updatedVars = [...localVariables, newVar];
    setLocalVariables(updatedVars);
    onUpdate({ ...workflow, variables: updatedVars });
    setIsNewVarMode(false);
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleNext = () => {
    const updatedSteps = [...workflow.steps];
    updatedSteps[workflow.currentStepIndex] = { ...currentStep, completed: true };
    
    let nextIndex = workflow.currentStepIndex;
    if (!isLastStep) {
      nextIndex += 1;
    }

    onUpdate({
      ...workflow,
      steps: updatedSteps,
      currentStepIndex: nextIndex,
      completed: isLastStep
    });

    if (isLastStep) {
      onBack(); // Go back to dashboard on finish
    }
  };

  const progressPercent = useMemo(() => {
    const len = workflow.steps.length || 1;
    return ((workflow.currentStepIndex) / len) * 100;
  }, [workflow]);

  // We render this block in two places (mobile drawer and desktop sidebar)
  const variablesListContent = (
    <div className="space-y-4">
      {localVariables.map((variable, idx) => {
        // Defensive checks for every single property accessed
        const safeKey = strictString(variable.key) || idx.toString();
        const safeLabel = strictString(variable.label) || 'Variable';
        const safeValue = strictString(variable.value);
        const safeDesc = strictString(variable.description);

        return (
          <div key={safeKey} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
              {safeLabel}
            </label>
            <input
              type="text"
              value={safeValue}
              onChange={(e) => handleVariableChange(safeKey, e.target.value)}
              className="w-full bg-transparent border-b border-gray-200 focus:border-brand-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 font-medium outline-none transition-colors placeholder-gray-300"
              placeholder="Enter value..."
            />
            {safeDesc && (
              <p className="text-[10px] text-gray-400 mt-1">{safeDesc}</p>
            )}
          </div>
        );
      })}

      {/* Add New Variable Form */}
      {isNewVarMode && (
        <div className="bg-brand-50 rounded-lg border border-brand-200 p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-brand-700">New Variable</span>
            <button onClick={() => setIsNewVarMode(false)} className="text-brand-400 hover:text-brand-700"><X size={14}/></button>
          </div>
          <input
            type="text"
            placeholder="Label (e.g. Zoom Link)"
            className="w-full text-sm border border-brand-200 rounded mb-2 p-1.5 focus:outline-none focus:border-brand-500"
            value={newVarKey}
            onChange={(e) => setNewVarKey(e.target.value)}
            autoFocus
          />
          <input
            type="text"
            placeholder="Value"
            className="w-full text-sm border border-brand-200 rounded mb-2 p-1.5 focus:outline-none focus:border-brand-500"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
          />
          <button
            onClick={handleAddVariable}
            disabled={!newVarKey || !newVarValue}
            className="w-full bg-brand-600 text-white text-xs py-1.5 rounded font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Add Variable
          </button>
        </div>
      )}

      {localVariables.length === 0 && !isNewVarMode && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400">No context variables yet.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">
               {strictString(workflow.templateName) || 'Workflow Run'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span>Step {workflow.currentStepIndex + 1} of {workflow.steps.length}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {workflow.completed && <span className="text-green-600 font-bold flex items-center gap-1 text-sm"><CheckCircle size={16}/> Completed</span>}
            <button 
              onClick={() => setShowMobileVars(!showMobileVars)} 
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative"
            >
              <SlidersHorizontal size={20} />
              {localVariables.filter(v => !v.value).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left: Step Navigation (Desktop) */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 pl-2">Steps</h3>
          <div className="space-y-1">
            {workflow.steps.map((step, idx) => (
              <div 
                key={strictString(step.id) || idx}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors
                  ${idx === workflow.currentStepIndex ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-gray-600'}
                  ${idx < workflow.currentStepIndex ? 'text-gray-400' : ''}
                `}
              >
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0
                  ${idx < workflow.currentStepIndex ? 'bg-green-100 text-green-600' : (idx === workflow.currentStepIndex ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500')}
                `}>
                  {idx < workflow.currentStepIndex ? <CheckCircle size={12} /> : idx + 1}
                </div>
                <span className="truncate">{strictString(step.title)}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <div className="max-w-3xl mx-auto">
            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col">
              <div className="mb-6">
                <span className="text-brand-600 font-medium text-sm tracking-wide uppercase">Current Step</span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{strictString(currentStep.title)}</h2>
                <div className="prose prose-slate prose-lg text-gray-600 leading-relaxed">
                  <p>{renderTextWithVariables(strictString(currentStep.description))}</p>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform active:scale-95"
                >
                  {isLastStep ? 'Finish Workflow' : 'Complete & Next'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Mobile Variable Drawer/Overlay */}
            {showMobileVars && (
              <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobileVars(false)}>
                 <div 
                   className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-900">Context Variables</h3>
                      <div className="flex items-center gap-2">
                        {!isNewVarMode && (
                          <button onClick={() => setIsNewVarMode(true)} className="p-1.5 hover:bg-gray-100 rounded-md">
                            <Plus size={18} />
                          </button>
                        )}
                        <button onClick={() => setShowMobileVars(false)} className="p-1.5 hover:bg-gray-100 rounded-md">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    {variablesListContent}
                 </div>
              </div>
            )}

          </div>
        </main>

        {/* Right: Context Variables Sidebar (Desktop) */}
        <aside className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-6 shrink-0 hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Context Variables</h3>
            {!isNewVarMode && (
              <button 
                onClick={() => setIsNewVarMode(true)}
                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                title="Add new variable"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {variablesListContent}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-800 leading-relaxed">
            <strong>Pro Tip:</strong> Information entered here persists across steps. Use this for links, IDs, or names generated during the workflow.
          </div>
        </aside>
      </div>
    </div>
  );
};