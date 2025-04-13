// src/features/vfs/store/vfs-store.ts
import { WorkflowStep } from '@/features/ollama-api/tool-schemas/workflow-schema';
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Enable MapSet plugin for Immer
enableMapSet();

export type NodeType = 'workflow' | 'service' | 'directory';
export type EdgeType = 'uses' | 'contains' | 'depends_on';

export interface ServiceMethod {
  name: string;
  content: string;
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  path: string;
  content?: {
    // For workflow nodes
    interface?: WorkflowStep;
    steps?: WorkflowStep[];
    // For service nodes
    template?: string;
    methods?: ServiceMethod[];
  };
}

export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: EdgeType;
  properties?: Record<string, any>;
}

interface VfsStore {
  // Graph structure
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;

  // UI state
  selectedNode: string | null;
  expandedNodes: Set<string>;

  // Actions
  setSelectedNode: (nodeId: string | null) => void;
  toggleNode: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;

  // Node operations
  createNode: (name: string, type: NodeType, path: string, content?: Node['content']) => string;
  getNode: (nodeId: string) => Node | null;
  getNodeByPath: (path: string) => Node | null;
  renameNode: (nodeId: string, newName: string) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  createEdge: (
    source: string,
    target: string,
    type: EdgeType,
    properties?: Record<string, any>,
  ) => string;
  getEdges: (nodeId: string, type?: EdgeType) => Edge[];
  deleteEdge: (edgeId: string) => void;

  // Content operations
  updateWorkflowContent: (
    nodeId: string,
    content: { interface?: WorkflowStep; steps?: WorkflowStep[] },
  ) => void;
  updateServiceContent: (
    nodeId: string,
    content: { template?: string; methods?: ServiceMethod[] },
  ) => void;

  // Workflow operations
  createWorkflow: (interfaceData: WorkflowStep) => string;
  addStepsToWorkflow: (workflowId: string, steps: WorkflowStep[]) => void;
}

export const useVfsStore = create<VfsStore>()(
  immer((set, get) => ({
    // Initial state
    nodes: new Map(),
    edges: new Map(),
    selectedNode: null,
    expandedNodes: new Set(),

    // UI actions
    setSelectedNode: nodeId =>
      set(state => {
        state.selectedNode = nodeId;
      }),

    toggleNode: nodeId =>
      set(state => {
        if (state.expandedNodes.has(nodeId)) {
          state.expandedNodes.delete(nodeId);
        } else {
          state.expandedNodes.add(nodeId);
        }
      }),

    isNodeExpanded: nodeId => get().expandedNodes.has(nodeId),

    // Node operations
    createNode: (name, type, path, content) => {
      const nodeId = crypto.randomUUID();
      set(state => {
        state.nodes.set(nodeId, {
          id: nodeId,
          name,
          type,
          path,
          content,
        });
      });
      return nodeId;
    },

    getNode: nodeId => get().nodes.get(nodeId) || null,

    getNodeByPath: path => {
      const nodes = get().nodes;
      for (const node of nodes.values()) {
        if (node.path === path) return node;
      }
      return null;
    },

    renameNode: (nodeId, newName) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (node) {
          node.name = newName;
        }
      }),

    deleteNode: nodeId =>
      set(state => {
        // Delete the node
        state.nodes.delete(nodeId);

        // Delete all edges connected to this node
        for (const [edgeId, edge] of state.edges.entries()) {
          if (edge.source === nodeId || edge.target === nodeId) {
            state.edges.delete(edgeId);
          }
        }
      }),

    // Edge operations
    createEdge: (source, target, type, properties) => {
      const edgeId = crypto.randomUUID();
      set(state => {
        state.edges.set(edgeId, {
          id: edgeId,
          source,
          target,
          type,
          properties,
        });
      });
      return edgeId;
    },

    getEdges: (nodeId, type) => {
      const edges = get().edges;
      const result: Edge[] = [];
      for (const edge of edges.values()) {
        if ((edge.source === nodeId || edge.target === nodeId) && (!type || edge.type === type)) {
          result.push(edge);
        }
      }
      return result;
    },

    deleteEdge: edgeId =>
      set(state => {
        state.edges.delete(edgeId);
      }),

    // Content operations
    updateWorkflowContent: (nodeId, content) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (node && node.type === 'workflow') {
          node.content = { ...node.content, ...content };
        }
      }),

    updateServiceContent: (nodeId, content) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (node && node.type === 'service') {
          node.content = { ...node.content, ...content };
        }
      }),

    // Workflow operations
    createWorkflow: interfaceData => {
      // Create workflows directory if it doesn't exist
      let workflowsDir = get().getNodeByPath('/workflows');
      if (!workflowsDir) {
        const workflowsDirId = get().createNode('workflows', 'directory', '/workflows');
        workflowsDir = get().getNode(workflowsDirId)!;
      }

      // Generate a unique name for the workflow
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const workflowName = `workflow-${timestamp}`;
      const workflowPath = `/workflows/${workflowName}`;

      // Create the workflow node
      const workflowId = get().createNode(workflowName, 'workflow', workflowPath, {
        interface: interfaceData,
      });

      // Create the 'contains' edge from workflows directory to the new workflow
      get().createEdge(workflowsDir.id, workflowId, 'contains');

      return workflowId;
    },

    addStepsToWorkflow: (workflowId, steps) =>
      set(state => {
        const node = state.nodes.get(workflowId);
        if (node && node.type === 'workflow') {
          node.content = { ...node.content, steps };
        }
      }),
  })),
);
