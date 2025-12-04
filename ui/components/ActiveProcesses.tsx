import React, { useMemo } from 'react';
import { Workflow, WorkflowStatus, getIntervalDays } from '../types';
import { MoreHorizontal, Trash2, PlayCircle } from 'lucide-react';

interface ActiveProcessesProps {
  workflows: Workflow[];
  onResumeWorkflow: (workflow: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
  searchQuery?: string;
}

// Helper to ensure safe strings for rendering
const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

// Calculate workflow status
const getWorkflowStatus = (workflow: Workflow): WorkflowStatus => {
  if (workflow.completed) return 'completed';

  // Check if overdue for recurring workflows
  if (workflow.isRecurring && workflow.recurrenceInterval) {
    const intervalDays = getIntervalDays(workflow.recurrenceInterval);
    const lastActivity = workflow.completedAt ? new Date(workflow.completedAt) : new Date(workflow.startedAt);
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity > intervalDays) return 'overdue';
  }

  // If there's been activity recently, it's running
  const startedAt = new Date(workflow.startedAt);
  const daysSinceStart = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24));

  // If started within last 24 hours or has progress, consider it running
  if (daysSinceStart < 1 || workflow.currentStepIndex > 0) {
    return 'running';
  }

  return 'idle';
};

// Format date for display
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

// Status badge component
const StatusBadge: React.FC<{ status: WorkflowStatus }> = ({ status }) => {
  const styles: Record<WorkflowStatus, string> = {
    running: 'bg-blue-100 text-blue-700',
    idle: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700'
  };

  const labels: Record<WorkflowStatus, string> = {
    running: 'RUNNING',
    idle: 'IDLE',
    overdue: 'OVERDUE',
    completed: 'COMPLETED'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const ActiveProcesses: React.FC<ActiveProcessesProps> = ({
  workflows,
  onResumeWorkflow,
  onDeleteWorkflow,
  searchQuery = ''
}) => {
  // Filter workflows based on search query and group by template for recurring
  const processedWorkflows = useMemo(() => {
    // Filter by search query
    let filtered = workflows.filter(w => {
      const query = searchQuery.toLowerCase();
      return safeStr(w.templateName).toLowerCase().includes(query);
    });

    // Group recurring workflows by templateId - show only the latest run
    const groupedByTemplate = new Map<string, Workflow>();
    const nonRecurring: Workflow[] = [];

    filtered.forEach(workflow => {
      if (workflow.isRecurring) {
        const existing = groupedByTemplate.get(workflow.templateId);
        if (!existing || new Date(workflow.startedAt) > new Date(existing.startedAt)) {
          groupedByTemplate.set(workflow.templateId, workflow);
        }
      } else {
        nonRecurring.push(workflow);
      }
    });

    // Combine recurring (latest only) and non-recurring
    return [...Array.from(groupedByTemplate.values()), ...nonRecurring];
  }, [workflows, searchQuery]);

  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const handleMenuToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteWorkflow(id);
    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="space-y-4">
      {processedWorkflows.map((workflow) => {
        const status = getWorkflowStatus(workflow);
        const isOpen = openMenuId === workflow.id;

        return (
          <div
            key={workflow.id}
            onClick={() => onResumeWorkflow(workflow)}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer group"
          >
            {/* Left side: Status indicator + info */}
            <div className="flex items-center gap-4">
              {/* Vertical status bar */}
              <div
                className={`w-1 h-12 rounded-full ${
                  status === 'running' ? 'bg-blue-500' :
                  status === 'overdue' ? 'bg-red-500' :
                  status === 'idle' ? 'bg-gray-300' :
                  'bg-green-500'
                }`}
              />

              {/* Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {safeStr(workflow.templateName) || 'Untitled Run'}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <StatusBadge status={status} />
                  <span className="text-gray-300">|</span>
                  <span>Step {workflow.currentStepIndex + 1} of {workflow.steps.length}</span>
                  <span className="text-gray-300">|</span>
                  <span>Last run: {formatDate(workflow.startedAt)}</span>
                </div>
              </div>
            </div>

            {/* Right side: Menu */}
            <div className="relative">
              <button
                onClick={(e) => handleMenuToggle(workflow.id, e)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                  <button
                    onClick={(e) => handleDelete(workflow.id, e)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {processedWorkflows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No matching runs' : 'No active runs'}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery
              ? `No runs match "${searchQuery}"`
              : 'Start a new run from your workflows to see activity here.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
