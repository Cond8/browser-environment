import { format } from 'date-fns';
import React, { useState } from 'react';
import { Service, useServiceStore } from '../store/service-store';
import { StoredWorkflow, useWorkflowStore } from '../store/workflow-store';

const VirtualFileSystem: React.FC = () => {
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  // Use memoized selectors to prevent unnecessary re-renders
  const getWorkflows = useWorkflowStore(state => state.getAllWorkflows);
  const getServices = useServiceStore(state => state.getAllServices);

  const workflows = getWorkflows();
  const services = getServices();

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const WorkflowItem: React.FC<{ workflow: StoredWorkflow }> = ({ workflow }) => {
    const isExpanded = expandedWorkflow === workflow.id;

    return (
      <li className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <button
          className="w-full p-3 flex items-center"
          onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
        >
          <span className="text-2xl mr-3">📋</span>
          <div className="flex-1 text-left">
            <div className="flex justify-between items-center">
              <span className="font-medium">{workflow.name}</span>
              <span className="text-sm text-gray-500">{formatDate(workflow.updatedAt)}</span>
            </div>
            <div className="text-sm text-gray-500">
              Interface: {workflow.content.interface.name}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="p-3 border-t border-gray-100">
            <div className="mb-3">
              <h4 className="font-medium text-sm text-gray-700 mb-1">Interface</h4>
              <div className="text-sm text-gray-600">
                <p>Service: {workflow.content.interface.service}</p>
                <p>Method: {workflow.content.interface.method}</p>
                <p>Goal: {workflow.content.interface.goal}</p>
                {workflow.content.interface.inputs && (
                  <p>Inputs: {workflow.content.interface.inputs.join(', ')}</p>
                )}
                {workflow.content.interface.outputs && (
                  <p>Outputs: {workflow.content.interface.outputs.join(', ')}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Steps</h4>
              <ul className="space-y-2">
                {workflow.content.steps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                    <p className="font-medium">{step.name}</p>
                    <p>Service: {step.service}</p>
                    <p>Method: {step.method}</p>
                    <p>Goal: {step.goal}</p>
                    {step.inputs && <p>Inputs: {step.inputs.join(', ')}</p>}
                    {step.outputs && <p>Outputs: {step.outputs.join(', ')}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </li>
    );
  };

  const ServiceItem: React.FC<{ service: Service }> = ({ service }) => {
    return (
      <li className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <span className="text-2xl mr-3">📜</span>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">{service.name}</span>
            <span className="text-sm text-gray-500">{formatDate(service.updatedAt)}</span>
          </div>
          <div className="text-sm text-gray-500">JavaScript Service</div>
        </div>
      </li>
    );
  };

  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Workflows</h2>
        {workflows.length === 0 ? (
          <p className="text-gray-500">No workflows in the system</p>
        ) : (
          <ul className="space-y-2">
            {workflows.map(workflow => (
              <WorkflowItem key={workflow.id} workflow={workflow} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Services</h2>
        {services.length === 0 ? (
          <p className="text-gray-500">No services in the system</p>
        ) : (
          <ul className="space-y-2">
            {services.map(service => (
              <ServiceItem key={service.id} service={service} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default VirtualFileSystem;
