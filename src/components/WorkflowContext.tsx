import { createContext, useContext, ReactNode } from 'react';
import { Workflow, ProjectType } from '../types/project';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface WorkflowContextType {
  workflows: Workflow[];
  addWorkflow: (name: string, actions: string[], assignedTypes?: ProjectType[]) => Promise<string>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  assignWorkflowToTypes: (workflowId: string, types: ProjectType[]) => Promise<void>;
  getWorkflowsForType: (type: ProjectType) => Workflow[];
  loading: boolean;
  canEdit: boolean; // Admin only
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { 
    value: workflows, 
    setValue: setWorkflows, 
    loading,
    canEdit 
  } = useSystemSettings<Workflow[]>('workflows', []);

  const addWorkflow = async (name: string, actions: string[], assignedTypes?: ProjectType[]) => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      actions,
      assignedTypes: assignedTypes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await setWorkflows([...workflows, newWorkflow]);
    return newWorkflow.id;
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    await setWorkflows(workflows.map(w => 
      w.id === id 
        ? { ...w, ...updates, updated_at: new Date().toISOString() }
        : w
    ));
  };

  const deleteWorkflow = async (id: string) => {
    await setWorkflows(workflows.filter(w => w.id !== id));
  };

  const assignWorkflowToTypes = async (workflowId: string, types: ProjectType[]) => {
    await setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, assignedTypes: types, updated_at: new Date().toISOString() }
        : w
    ));
  };

  const getWorkflowsForType = (type: ProjectType): Workflow[] => {
    return workflows.filter(w => 
      w.assignedTypes && w.assignedTypes.includes(type)
    );
  };

  return (
    <WorkflowContext.Provider value={{
      workflows,
      addWorkflow,
      updateWorkflow,
      deleteWorkflow,
      assignWorkflowToTypes,
      getWorkflowsForType,
      loading,
      canEdit
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflows() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflows must be used within WorkflowProvider');
  }
  return context;
}
