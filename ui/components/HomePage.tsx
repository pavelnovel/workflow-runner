import React, { useMemo } from 'react';
import { Template, Workflow, getIntervalDays } from '../types';
import { AlertCircle, ArrowRight, PlayCircle, AlertTriangle, Layers, FileText } from 'lucide-react';

interface HomePageProps {
  templates: Template[];
  activeWorkflows: Workflow[];
  onResumeWorkflow: (workflow: Workflow) => void;
  onNavigateToProcesses: () => void;
}

// Helper to ensure safe strings for rendering
const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

// Calculate if a workflow is overdue based on recurrence interval
const isOverdue = (workflow: Workflow): boolean => {
  if (!workflow.isRecurring || !workflow.recurrenceInterval) return false;

  const intervalDays = getIntervalDays(workflow.recurrenceInterval);
  const lastActivity = workflow.completedAt ? new Date(workflow.completedAt) : new Date(workflow.startedAt);
  const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceActivity > intervalDays;
};

// Format date for display
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

// Format time for display
const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const HomePage: React.FC<HomePageProps> = ({
  templates,
  activeWorkflows,
  onResumeWorkflow,
  onNavigateToProcesses
}) => {
  // Calculate stats
  const stats = useMemo(() => {
    const runningProcesses = activeWorkflows.filter(w => !w.completed).length;
    const highPriorityItems = activeWorkflows.filter(w => isOverdue(w));
    const templatesAvailable = templates.length;

    return {
      runningProcesses,
      highPriority: highPriorityItems.length,
      templatesAvailable,
      highPriorityItems
    };
  }, [templates, activeWorkflows]);

  // Get progress percentage for a workflow
  const getProgress = (workflow: Workflow): number => {
    if (workflow.steps.length === 0) return 0;
    const completedCount = workflow.steps.filter(s => s.completed).length;
    return Math.round((completedCount / workflow.steps.length) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Running Processes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Runs</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.runningProcesses}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <PlayCircle className="text-gray-500" size={20} />
            </div>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">High Priority</p>
              <p className={`text-4xl font-bold mt-2 ${stats.highPriority > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.highPriority}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.highPriority > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={stats.highPriority > 0 ? 'text-red-500' : 'text-gray-500'} size={20} />
            </div>
          </div>
        </div>

        {/* Templates Available */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Workflows Available</p>
              <p className="text-4xl font-bold text-brand-600 mt-2">{stats.templatesAvailable}</p>
            </div>
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Layers className="text-brand-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Attention Section */}
      {stats.highPriorityItems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">High Priority Attention</h2>
          <div className="space-y-3">
            {stats.highPriorityItems.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onResumeWorkflow(workflow)}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Alert Icon */}
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-red-500" size={20} />
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {safeStr(workflow.templateName) || 'Untitled Run'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Updated {formatTime(workflow.startedAt)} | Started {formatDate(workflow.startedAt)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{getProgress(workflow)}%</p>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                  <ArrowRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity / Quick Actions */}
      {activeWorkflows.length > 0 && stats.highPriorityItems.length === 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={onNavigateToProcesses}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {activeWorkflows.slice(0, 3).map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onResumeWorkflow(workflow)}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                    <FileText size={18} className="text-brand-600" />
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {safeStr(workflow.templateName) || 'Untitled Run'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Step {workflow.currentStepIndex + 1} of {workflow.steps.length} | Started {formatDate(workflow.startedAt)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{getProgress(workflow)}%</p>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                  <ArrowRight className="text-gray-300 group-hover:text-brand-500 transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {activeWorkflows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active runs</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Start a new run from your workflows to see activity here.
          </p>
        </div>
      )}
    </div>
  );
};
