// src/features/vfs/components/virtual-file-system.tsx
import { useEditorStore } from '@/features/editor/stores/editor-store';
import { format } from 'date-fns';
import React from 'react';
import { Service, useServiceStore } from '../store/service-store';
import { StoredWorkflow, useWorkflowStore } from '../store/workflow-store';
const VirtualFileSystem: React.FC = () => {
  // Use memoized selectors to prevent unnecessary re-renders
  const getWorkflows = useWorkflowStore(state => state.getAllWorkflows);
  const getServices = useServiceStore(state => state.getAllServices);
  const setActiveEditor = useEditorStore(state => state.setFilePath);

  const workflows = getWorkflows();
  const services = getServices();

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const WorkflowItem: React.FC<{ workflow: StoredWorkflow }> = ({ workflow }) => {
    return (
      <button
        className="w-full bg-card text-card-foreground rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setActiveEditor(workflow.id)}
      >
        <div className="w-full p-3 flex items-center">
          <span className="text-2xl mr-3">📋</span>
          <div className="flex-1 text-left">
            <div className="flex flex-col justify-between">
              <span className="font-medium">{workflow.name}</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(workflow.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const ServiceItem: React.FC<{ service: Service }> = ({ service }) => {
    return (
      <button
        className="w-full bg-card text-card-foreground rounded-lg shadow hover:shadow-md transition-shadow"
        onClick={() => setActiveEditor(service.id)}
      >
        <div className="flex items-center p-3">
          <span className="text-2xl mr-3">📜</span>
          <div className="flex-1">
            <div className="flex flex-col justify-between">
              <span className="font-medium">{service.name}</span>
              <span className="text-sm text-muted-foreground">{formatDate(service.updatedAt)}</span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Workflows</h2>
        {workflows.length === 0 ? (
          <p className="text-muted-foreground">No workflows in the system</p>
        ) : (
          <ul className="space-y-2">
            {workflows.map(workflow => (
              <li key={workflow.id}>
                <WorkflowItem workflow={workflow} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Services</h2>
        {services.length === 0 ? (
          <p className="text-muted-foreground">No services in the system</p>
        ) : (
          <ul className="space-y-2">
            {services.map(service => (
              <li key={service.id}>
                <ServiceItem service={service} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default VirtualFileSystem;
