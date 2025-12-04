import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Template, Variable, Step, Section, RecurrenceInterval, stripEmojis } from '../types';
import { Save, ArrowLeft, Plus, Trash2, Loader2, Settings, X, ChevronDown, ChevronRight, GripVertical, FolderPlus } from 'lucide-react';
import { RichStepEditor } from './RichStepEditor';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TemplateEditorProps {
  initialTemplate: Template;
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
}

// Sortable Step Item Component
const SortableStepItem: React.FC<{
  step: Step;
  index: number;
  globalIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ step, index, globalIndex, isSelected, onSelect, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 rounded-lg transition-all ${
        isSelected
          ? 'bg-brand-50 border border-brand-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
      >
        <GripVertical size={14} />
      </button>

      {/* Step Content */}
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 py-2 pr-2 text-left"
      >
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
          isSelected
            ? 'bg-brand-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {globalIndex + 1}
        </span>
        <span className={`text-sm truncate ${
          isSelected ? 'text-brand-700 font-medium' : 'text-gray-700'
        }`}>
          {stripEmojis(step.title) || 'Untitled Step'}
        </span>
      </button>

      {/* Delete Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

// Sortable Section Component
const SortableSection: React.FC<{
  section: Section;
  steps: Step[];
  selectedStepId: string | null;
  globalStepStartIndex: number;
  onSelectStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onToggleCollapse: () => void;
  onDeleteSection: () => void;
  onUpdateTitle: (title: string) => void;
}> = ({
  section,
  steps,
  selectedStepId,
  globalStepStartIndex,
  onSelectStep,
  onDeleteStep,
  onToggleCollapse,
  onDeleteSection,
  onUpdateTitle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const handleTitleSave = () => {
    onUpdateTitle(editTitle);
    setIsEditingTitle(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      {/* Section Header */}
      <div className="group flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1.5">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={14} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-0.5 text-gray-500 hover:text-gray-700"
        >
          {section.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        {isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="flex-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded px-1 py-0.5 outline-none"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
          >
            {section.title}
          </span>
        )}

        <button
          onClick={onDeleteSection}
          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Section Steps */}
      {!section.isCollapsed && (
        <div className="pl-4 pt-1 space-y-0.5">
          <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {steps.map((step, idx) => (
              <SortableStepItem
                key={step.id}
                step={step}
                index={idx}
                globalIndex={globalStepStartIndex + idx}
                isSelected={selectedStepId === step.id}
                onSelect={() => onSelectStep(step.id)}
                onDelete={() => onDeleteStep(step.id)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

// Draggable Variable Component
const DraggableVariable: React.FC<{
  variable: Variable;
  index: number;
  onUpdate: (field: keyof Variable, value: string) => void;
  onRemove: () => void;
  onInsert: () => void;
}> = ({ variable, index, onUpdate, onRemove, onInsert }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/variable-key', variable.key);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-gray-50 rounded-lg p-3 border border-gray-100 group cursor-grab active:cursor-grabbing hover:border-brand-200 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={variable.label || ''}
            onChange={(e) => onUpdate('label', e.target.value)}
            className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none"
            placeholder="Label"
          />
          <input
            type="text"
            value={variable.key || ''}
            onChange={(e) => onUpdate('key', e.target.value)}
            className="w-full text-xs font-mono text-gray-500 bg-transparent border-none outline-none mt-0.5"
            placeholder="variableKey"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onInsert}
            className="p-1 text-brand-500 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            title="Insert into step"
          >
            +Insert
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Drag to editor or click +Insert</p>
    </div>
  );
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ initialTemplate, onSave, onCancel }) => {
  // Helper to forcibly convert any value to a string
  const forceString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '';
    return String(val);
  };

  // Sanitize template on load
  const sanitizeTemplate = (t: Template): Template => {
    const cleanVariables = Array.isArray(t.defaultVariables)
      ? t.defaultVariables
          .filter(v => v && typeof v === 'object' && !Array.isArray(v))
          .map(v => ({
            key: forceString(v.key),
            label: forceString(v.label),
            value: forceString(v.value),
            description: forceString(v.description)
          }))
      : [];

    const cleanSteps = Array.isArray(t.steps)
      ? t.steps
          .filter(s => s && typeof s === 'object' && !Array.isArray(s))
          .map(s => ({
            id: forceString(s.id) || `step_${Math.random()}`,
            title: stripEmojis(forceString(s.title)),
            description: forceString(s.description),
            completed: Boolean(s.completed),
            // Sanitize sectionId to ensure string comparison works for section filtering
            sectionId: s.sectionId ? forceString(s.sectionId) : undefined
          }))
      : [];

    const cleanSections = Array.isArray(t.sections)
      ? t.sections.map(s => ({
          id: forceString(s.id) || `section_${Math.random()}`,
          title: forceString(s.title),
          isCollapsed: Boolean(s.isCollapsed)
        }))
      : [];

    const isRecurring = Boolean(t.isRecurring);
    return {
      ...t,
      name: forceString(t.name),
      description: forceString(t.description),
      isRecurring,
      recurrenceInterval: isRecurring ? (t.recurrenceInterval || 'biweekly') : undefined,
      defaultVariables: cleanVariables,
      steps: cleanSteps,
      sections: cleanSections
    };
  };

  const [template, setTemplate] = useState<Template>(sanitizeTemplate(initialTemplate));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    template.steps.length > 0 ? template.steps[0].id : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get current step
  const currentStep = useMemo(() => {
    return template.steps.find(s => s.id === selectedStepId) || null;
  }, [template.steps, selectedStepId]);

  // Get steps organized by section
  const { unsectionedSteps, sectionedSteps } = useMemo(() => {
    const sections = template.sections || [];
    const unsectioned = template.steps.filter(s => !s.sectionId);
    const sectioned = sections.map(section => ({
      section,
      steps: template.steps.filter(s => s.sectionId === section.id)
    }));
    return { unsectionedSteps: unsectioned, sectionedSteps: sectioned };
  }, [template.steps, template.sections]);

  // Calculate global step index for numbering
  const getGlobalStepIndex = useCallback((stepId: string) => {
    return template.steps.findIndex(s => s.id === stepId);
  }, [template.steps]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Variable management
  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    const newVars = [...(template.defaultVariables || [])];
    if (!newVars[index]) return;
    newVars[index] = { ...newVars[index], [field]: value };
    setTemplate({ ...template, defaultVariables: newVars });
  };

  const addVariable = () => {
    const newVar: Variable = {
      key: `var_${Date.now()}`,
      label: 'New Variable',
      value: '',
      description: ''
    };
    setTemplate({ ...template, defaultVariables: [...(template.defaultVariables || []), newVar] });
  };

  const removeVariable = (index: number) => {
    const newVars = (template.defaultVariables || []).filter((_, i) => i !== index);
    setTemplate({ ...template, defaultVariables: newVars });
  };

  // Step management
  const updateStep = (field: keyof Step, value: string) => {
    if (!selectedStepId) return;
    const newSteps = template.steps.map(s =>
      s.id === selectedStepId ? { ...s, [field]: value } : s
    );
    setTemplate({ ...template, steps: newSteps });
  };

  const addStep = (sectionId?: string) => {
    const newStep: Step = {
      id: `step_${Date.now()}`,
      title: 'New Step',
      description: '',
      completed: false,
      sectionId
    };
    const newSteps = [...template.steps, newStep];
    setTemplate({ ...template, steps: newSteps });
    setSelectedStepId(newStep.id);
  };

  const removeStep = (stepId: string) => {
    if (template.steps.length <= 1) return;
    const newSteps = template.steps.filter(s => s.id !== stepId);
    setTemplate({ ...template, steps: newSteps });
    if (selectedStepId === stepId) {
      setSelectedStepId(newSteps[0]?.id || null);
    }
  };

  // Section management
  const addSection = () => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      isCollapsed: false
    };
    setTemplate({
      ...template,
      sections: [...(template.sections || []), newSection]
    });
  };

  const removeSection = (sectionId: string) => {
    // Move steps from this section to unsectioned
    const newSteps = template.steps.map(s =>
      s.sectionId === sectionId ? { ...s, sectionId: undefined } : s
    );
    const newSections = (template.sections || []).filter(s => s.id !== sectionId);
    setTemplate({ ...template, steps: newSteps, sections: newSections });
  };

  const toggleSectionCollapse = (sectionId: string) => {
    const newSections = (template.sections || []).map(s =>
      s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s
    );
    setTemplate({ ...template, sections: newSections });
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    const newSections = (template.sections || []).map(s =>
      s.id === sectionId ? { ...s, title } : s
    );
    setTemplate({ ...template, sections: newSections });
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeStep = template.steps.find(s => s.id === active.id);
    const overStep = template.steps.find(s => s.id === over.id);

    if (activeStep && overStep) {
      // Reorder steps
      const oldIndex = template.steps.findIndex(s => s.id === active.id);
      const newIndex = template.steps.findIndex(s => s.id === over.id);

      const newSteps = [...template.steps];
      const [removed] = newSteps.splice(oldIndex, 1);
      // Update section if dropping into a different section
      removed.sectionId = overStep.sectionId;
      newSteps.splice(newIndex, 0, removed);

      setTemplate({ ...template, steps: newSteps });
    }

    // Check if dragging a section
    const activeSection = (template.sections || []).find(s => s.id === active.id);
    const overSection = (template.sections || []).find(s => s.id === over.id);

    if (activeSection && overSection) {
      const sections = template.sections || [];
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);

      const newSections = [...sections];
      const [removed] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, removed);

      setTemplate({ ...template, sections: newSections });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(template);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Insert variable at current position in editor
  const insertVariable = (variableKey: string) => {
    if (currentStep) {
      const newDescription = currentStep.description + `{{${variableKey}}}`;
      updateStep('description', newDescription);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <input
                type="text"
                value={forceString(template.name)}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="font-bold text-gray-900 text-lg bg-transparent border-none outline-none focus:ring-0 w-auto min-w-[200px]"
                placeholder="Template Name"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Template Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Save Changes</span>
            </button>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Template Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={forceString(template.description)}
                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                    placeholder="Brief description of this template..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={template.isRecurring || false}
                      onChange={(e) => setTemplate({ ...template, isRecurring: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Recurring process</span>
                  </label>
                  {template.isRecurring && (
                    <select
                      value={template.recurrenceInterval || 'biweekly'}
                      onChange={(e) => setTemplate({ ...template, recurrenceInterval: e.target.value as RecurrenceInterval })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main 3-Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Steps & Sections */}
          <aside
            style={{ width: sidebarWidth }}
            className="bg-white border-r border-gray-200 flex flex-col shrink-0 relative"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Steps</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={addSection}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-600 transition-colors"
                    title="Add Section"
                  >
                    <FolderPlus size={16} />
                  </button>
                  <button
                    onClick={() => addStep()}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-600 transition-colors"
                    title="Add Step"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {/* Unsectioned Steps */}
              <SortableContext
                items={unsectionedSteps.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {unsectionedSteps.map((step, idx) => (
                  <SortableStepItem
                    key={step.id}
                    step={step}
                    index={idx}
                    globalIndex={getGlobalStepIndex(step.id)}
                    isSelected={selectedStepId === step.id}
                    onSelect={() => setSelectedStepId(step.id)}
                    onDelete={() => removeStep(step.id)}
                  />
                ))}
              </SortableContext>

              {/* Sections with their steps */}
              <SortableContext
                items={(template.sections || []).map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sectionedSteps.map(({ section, steps }, sectionIdx) => {
                  // Calculate where these steps start in global order
                  const startIdx = unsectionedSteps.length +
                    sectionedSteps.slice(0, sectionIdx).reduce((acc, s) => acc + s.steps.length, 0);

                  return (
                    <SortableSection
                      key={section.id}
                      section={section}
                      steps={steps}
                      selectedStepId={selectedStepId}
                      globalStepStartIndex={startIdx}
                      onSelectStep={setSelectedStepId}
                      onDeleteStep={removeStep}
                      onToggleCollapse={() => toggleSectionCollapse(section.id)}
                      onDeleteSection={() => removeSection(section.id)}
                      onUpdateTitle={(title) => updateSectionTitle(section.id, title)}
                    />
                  );
                })}
              </SortableContext>

              {/* Add Step Button */}
              <button
                onClick={() => addStep()}
                className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-all text-sm flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Add Step
              </button>
            </div>

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-300 transition-colors"
              onMouseDown={handleResizeStart}
              style={{ backgroundColor: isResizing ? '#3b82f6' : 'transparent' }}
            />
          </aside>

          {/* Center: Step Editor */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
            {currentStep ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Step Title */}
                  <div className="p-4 border-b border-gray-100">
                    <input
                      type="text"
                      value={stripEmojis(forceString(currentStep.title))}
                      onChange={(e) => updateStep('title', e.target.value)}
                      className="w-full text-xl font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
                      placeholder="Step Title"
                    />
                  </div>

                  {/* Step Content Editor */}
                  <div className="p-4">
                    <RichStepEditor
                      value={forceString(currentStep.description)}
                      onChange={(value) => updateStep('description', value)}
                      placeholder="Write step instructions here. Drag variables from the right panel or use {{variableKey}} for dynamic content..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p>No steps yet.</p>
                  <button
                    onClick={() => addStep()}
                    className="mt-2 text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Add your first step
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar: Variables */}
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Variables</h3>
                <button
                  onClick={addVariable}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-600 transition-colors"
                  title="Add Variable"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Use {`{{key}}`} in steps</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {template.defaultVariables && template.defaultVariables.length > 0 ? (
                template.defaultVariables.map((variable, idx) => (
                  <DraggableVariable
                    key={idx}
                    variable={variable}
                    index={idx}
                    onUpdate={(field, value) => updateVariable(idx, field, value)}
                    onRemove={() => removeVariable(idx)}
                    onInsert={() => insertVariable(variable.key)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>No variables defined.</p>
                  <button
                    onClick={addVariable}
                    className="mt-2 text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Add variable
                  </button>
                </div>
              )}
            </div>

            {/* Quick Insert Hint */}
            {template.defaultVariables && template.defaultVariables.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Drag variables to the editor or click +Insert to add them to your step.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="bg-white rounded-lg shadow-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700">
            {template.steps.find(s => s.id === activeId)?.title ||
              (template.sections || []).find(s => s.id === activeId)?.title ||
              'Dragging...'}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
