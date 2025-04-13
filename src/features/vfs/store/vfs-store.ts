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

// --- Discriminated Union for Node Content ---
interface BaseNodeContent {}

interface WorkflowNodeContent extends BaseNodeContent {
  interface?: WorkflowStep;
  steps?: WorkflowStep[];
}

interface ServiceNodeContent extends BaseNodeContent {
  template?: string;
  methods?: ServiceMethod[];
  fileExtension: string;
  content: string;
}

interface DirectoryNodeContent extends BaseNodeContent {
  // Directories might have specific properties later
}

type NodeContent = WorkflowNodeContent | ServiceNodeContent | DirectoryNodeContent;

// --- Updated Node Interface ---
export interface Node<T extends NodeType = NodeType> {
  id: string;
  name: string;
  type: T;
  path: string; // Paths should be unique identifiers within the FS
  content?: T extends 'workflow'
    ? WorkflowNodeContent
    : T extends 'service'
      ? ServiceNodeContent
      : T extends 'directory'
        ? DirectoryNodeContent
        : NodeContent; // Fallback, though should be covered by specific types
}

export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: EdgeType;
  properties?: Record<string, any>;
}

// Internal state structure
interface VfsState {
  // Graph structure
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  pathIndex: Map<string, string>; // Map<path, nodeId>

  // UI state
  selectedNode: string | null;
  expandedNodes: Set<string>;

  // For memoization/cache invalidation
  stateVersion: number;
}

// Selector results cache
interface SelectorCache {
  [key: string]: {
    version: number;
    value: any;
  };
}

// Define our public store actions
interface VfsActions {
  // UI actions
  setSelectedNode: (nodeId: string | null) => void;
  toggleNode: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;

  // Node operations
  createNode: <T extends NodeType>(
    name: string,
    type: T,
    path: string,
    content?: Node<T>['content'],
  ) => string; // Returns nodeId

  renameNode: (nodeId: string, newName: string, newPath?: string) => void;
  deleteNode: (nodeId: string) => void;
  createDirectory: (name: string, path: string) => string; // Returns nodeId

  // Edge operations
  createEdge: (
    source: string,
    target: string,
    type: EdgeType,
    properties?: Record<string, any>,
  ) => string;

  deleteEdge: (edgeId: string) => void;

  // Content operations
  updateWorkflowContent: (nodeId: string, content: Partial<WorkflowNodeContent>) => void;

  updateServiceContent: (nodeId: string, content: Partial<ServiceNodeContent>) => void;

  // Workflow operations
  createWorkflow: (interfaceData: WorkflowStep) => string;
  addStepsToWorkflow: (workflowId: string, steps: WorkflowStep[]) => void;

  // Selectors
  getNode: (nodeId: string) => Node | null;
  getNodeByPath: (path: string) => Node | null;
  getNodeEdges: (nodeId: string, type?: EdgeType) => Edge[];
  getAllNodes: () => Node[];
  getAllEdges: () => Edge[];

  getContent: (filepath: string) => string;

  // New actions
  createService: (name: string, path: string, content: string) => string;
}

// Combine state and actions for the store type
type VfsStore = VfsState & VfsActions;

// Create a cache outside of the store to avoid recomputation
const selectorCache: SelectorCache = {};

// Helper for memoizing selectors
function createSelector<T>(store: VfsStore, selectorId: string, fn: () => T): T {
  const cacheKey = selectorId;
  const currentVersion = store.stateVersion;

  if (!selectorCache[cacheKey] || selectorCache[cacheKey].version !== currentVersion) {
    const result = fn();
    selectorCache[cacheKey] = {
      version: currentVersion,
      value: result,
    };

    // Cleanup old entries
    // This is a simple approach - in a real app, you might want a more sophisticated cache eviction strategy
    const keysToDelete = Object.keys(selectorCache).filter(
      key =>
        key.startsWith(`${selectorId.split('-')[0]}-`) &&
        selectorCache[key].version < currentVersion,
    );

    keysToDelete.forEach(key => {
      delete selectorCache[key];
    });
  }

  return selectorCache[cacheKey].value;
}

export const useVfsStore = create<VfsStore>()(
  immer((set, get) => ({
    // Initial state
    nodes: new Map(),
    edges: new Map(),
    pathIndex: new Map(),
    selectedNode: null,
    expandedNodes: new Set(),
    stateVersion: 0,

    // Selectors
    getNode: (nodeId: string) => {
      return createSelector(get(), `getNode-${nodeId}`, () => get().nodes.get(nodeId) || null);
    },

    getNodeByPath: (path: string) => {
      return createSelector(get(), `getNodeByPath-${path}`, () => {
        const nodeId = get().pathIndex.get(path);
        return nodeId ? get().nodes.get(nodeId) || null : null;
      });
    },

    getNodeEdges: (nodeId: string, type?: EdgeType) => {
      return createSelector(get(), `getNodeEdges-${nodeId}-${type || 'all'}`, () => {
        if (!get().nodes.has(nodeId)) {
          console.warn(`getNodeEdges: Node with ID ${nodeId} not found.`);
          return [];
        }

        const result: Edge[] = [];
        for (const edge of get().edges.values()) {
          if ((edge.source === nodeId || edge.target === nodeId) && (!type || edge.type === type)) {
            result.push(edge);
          }
        }
        return result;
      });
    },

    getAllNodes: () => {
      return createSelector(get(), 'getAllNodes', () => Array.from(get().nodes.values()));
    },

    getAllEdges: () => {
      return createSelector(get(), 'getAllEdges', () => Array.from(get().edges.values()));
    },

    // --- UI actions ---
    setSelectedNode: nodeId =>
      set(state => {
        state.selectedNode = nodeId;
        state.stateVersion++;
      }),

    toggleNode: nodeId =>
      set(state => {
        if (!state.nodes.has(nodeId)) {
          console.warn(`toggleNode: Node with ID ${nodeId} not found.`);
          return; // Or throw error
        }
        if (state.expandedNodes.has(nodeId)) {
          state.expandedNodes.delete(nodeId);
        } else {
          state.expandedNodes.add(nodeId);
        }
        state.stateVersion++;
      }),

    isNodeExpanded: nodeId => get().expandedNodes.has(nodeId),

    // --- Node operations ---
    createNode: <T extends NodeType>(
      name: string,
      type: T,
      path: string,
      content?: Node<T>['content'],
    ) => {
      if (get().pathIndex.has(path)) {
        throw new Error(`createNode: Path "${path}" already exists.`);
      }
      const nodeId = crypto.randomUUID();
      const newNode: Node<T> = { id: nodeId, name, type, path, content };

      set(state => {
        state.nodes.set(nodeId, newNode as Node);
        state.pathIndex.set(path, nodeId);
        state.stateVersion++;
      });
      return nodeId;
    },

    renameNode: (nodeId, newName, newPath) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (!node) {
          throw new Error(`renameNode: Node with ID ${nodeId} not found.`);
        }

        // Handle path change if provided
        if (newPath && newPath !== node.path) {
          if (state.pathIndex.has(newPath)) {
            throw new Error(`renameNode: New path "${newPath}" already exists.`);
          }
          // Update path index
          state.pathIndex.delete(node.path);
          state.pathIndex.set(newPath, nodeId);
          node.path = newPath;

          // If this is a directory, we should update paths of all children
          if (node.type === 'directory') {
            // Get all nodes that have this directory as a prefix of their path
            const oldPathPrefix = node.path;
            const newPathPrefix = newPath;

            // Update all child paths
            for (const [id, childNode] of state.nodes.entries()) {
              if (childNode.path.startsWith(oldPathPrefix + '/')) {
                // Calculate new path by replacing the prefix
                const childNewPath = childNode.path.replace(oldPathPrefix, newPathPrefix);

                // Update the path index
                state.pathIndex.delete(childNode.path);
                state.pathIndex.set(childNewPath, id);

                // Update the node path
                childNode.path = childNewPath;
              }
            }
          }
        }

        // Update name
        node.name = newName;
        state.stateVersion++;
      }),

    deleteNode: nodeId =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (!node) {
          console.warn(`deleteNode: Node with ID ${nodeId} not found.`);
          return; // Don't throw, maybe deletion is idempotent
        }

        // If it's a directory, recursively delete all children
        if (node.type === 'directory') {
          const pathPrefix = node.path + '/';

          // Find all children
          const nodesToDelete: string[] = [];
          for (const [id, childNode] of state.nodes.entries()) {
            if (childNode.path.startsWith(pathPrefix)) {
              nodesToDelete.push(id);
              state.pathIndex.delete(childNode.path);
            }
          }

          // Delete all child nodes
          nodesToDelete.forEach(id => state.nodes.delete(id));
        }

        // Delete the node
        state.nodes.delete(nodeId);
        // Remove from path index
        state.pathIndex.delete(node.path);

        // Delete all edges connected to this node
        const edgesToDelete: string[] = [];
        for (const [edgeId, edge] of state.edges.entries()) {
          if (edge.source === nodeId || edge.target === nodeId) {
            edgesToDelete.push(edgeId);
          }
        }
        edgesToDelete.forEach(edgeId => state.edges.delete(edgeId));

        // Clean up UI state if needed
        if (state.selectedNode === nodeId) {
          state.selectedNode = null;
        }
        state.expandedNodes.delete(nodeId);
        state.stateVersion++;
      }),

    createDirectory: (name, path) => {
      // Basic check for parent existence
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      if (path !== '/' && parentPath !== '/' && !get().pathIndex.has(parentPath)) {
        console.warn(
          `createDirectory: Parent directory "${parentPath}" does not exist for path "${path}". Creating parents automatically.`,
        );
        // Create parent directories automatically
        const parentParts = parentPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const part of parentParts) {
          currentPath += '/' + part;
          if (!get().pathIndex.has(currentPath)) {
            get().createNode(part, 'directory', currentPath, {});
          }
        }
      }

      return get().createNode(name, 'directory', path, {});
    },

    // --- Edge operations ---
    createEdge: (source, target, type, properties) => {
      const sourceNode = get().nodes.get(source);
      const targetNode = get().nodes.get(target);

      if (!sourceNode) {
        throw new Error(`createEdge: Source node with ID ${source} not found.`);
      }
      if (!targetNode) {
        throw new Error(`createEdge: Target node with ID ${target} not found.`);
      }

      // Add validation based on edge type and node types
      if (type === 'contains' && sourceNode.type !== 'directory') {
        throw new Error(
          `createEdge: 'contains' edge should originate from a directory node (source: ${source}).`,
        );
      }

      const edgeId = crypto.randomUUID();
      set(state => {
        state.edges.set(edgeId, {
          id: edgeId,
          source,
          target,
          type,
          properties,
        });
        state.stateVersion++;
      });
      return edgeId;
    },

    deleteEdge: edgeId =>
      set(state => {
        if (!state.edges.has(edgeId)) {
          console.warn(`deleteEdge: Edge with ID ${edgeId} not found.`);
          return; // Idempotent
        }
        state.edges.delete(edgeId);
        state.stateVersion++;
      }),

    // --- Content operations ---
    updateWorkflowContent: (nodeId, content) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (!node) {
          throw new Error(`updateWorkflowContent: Node with ID ${nodeId} not found.`);
        }
        if (node.type !== 'workflow') {
          throw new Error(
            `updateWorkflowContent: Node ${nodeId} is type "${node.type}", expected "workflow".`,
          );
        }
        // Type assertion needed because Immer/Zustand struggle with the generic Node<T> inside the update
        const workflowNode = node as Node<'workflow'>;
        workflowNode.content = { ...workflowNode.content, ...content };
        state.stateVersion++;
      }),

    updateServiceContent: (nodeId, content) =>
      set(state => {
        const node = state.nodes.get(nodeId);
        if (!node) {
          throw new Error(`updateServiceContent: Node with ID ${nodeId} not found.`);
        }
        if (node.type !== 'service') {
          throw new Error(
            `updateServiceContent: Node ${nodeId} is type "${node.type}", expected "service".`,
          );
        }
        const serviceNode = node as Node<'service'>;
        serviceNode.content = { ...serviceNode.content, ...content } as ServiceNodeContent;
        state.stateVersion++;
      }),

    // --- Workflow operations ---
    createWorkflow: interfaceData => {
      const workflowsDirPath = '/workflows';
      let workflowsDirNode = get().getNodeByPath(workflowsDirPath);

      // Create workflows directory if it doesn't exist
      if (!workflowsDirNode) {
        const workflowsDirId = get().createDirectory('workflows', workflowsDirPath);
        workflowsDirNode = get().getNode(workflowsDirId)!; // Should exist now
      } else if (workflowsDirNode.type !== 'directory') {
        // Handle case where /workflows exists but isn't a directory
        throw new Error(
          `createWorkflow: Path "${workflowsDirPath}" exists but is not a directory.`,
        );
      }

      // Generate a unique name/path for the workflow
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const workflowName = `workflow-${timestamp}`;
      const workflowPath = `${workflowsDirPath}/${workflowName}`; // Use path from directory

      // Create the workflow node
      const workflowId = get().createNode<'workflow'>(workflowName, 'workflow', workflowPath, {
        interface: interfaceData,
        steps: [], // Initialize with empty steps array
      });

      // Create the 'contains' edge from workflows directory to the new workflow
      get().createEdge(workflowsDirNode.id, workflowId, 'contains');

      return workflowId;
    },

    addStepsToWorkflow: (workflowId, steps) => {
      // Use updateWorkflowContent for consistency and type safety
      const currentNode = get().getNode(workflowId);
      if (!currentNode || currentNode.type !== 'workflow') {
        throw new Error(
          `addStepsToWorkflow: Workflow node with ID ${workflowId} not found or not a workflow.`,
        );
      }
      // Get existing steps to append, or initialize if undefined
      const existingSteps = (currentNode.content as WorkflowNodeContent)?.steps || [];
      get().updateWorkflowContent(workflowId, { steps: [...existingSteps, ...steps] });
    },

    getContent: (filepath: string) => {
      const node = get().getNodeByPath(filepath);
      if (!node) {
        throw new Error(`getContent: Node with path "${filepath}" not found.`);
      }
      return node.content as string;
    },

    // --- New actions ---
    createService: (name, path, content) => {
      const servicesDirPath = '/services';
      let servicesDirNode = get().getNodeByPath(servicesDirPath);

      // Create services directory if it doesn't exist
      if (!servicesDirNode) {
        const servicesDirId = get().createDirectory('services', servicesDirPath);
        servicesDirNode = get().getNode(servicesDirId)!;
      } else if (servicesDirNode.type !== 'directory') {
        throw new Error(`createService: Path "${servicesDirPath}" exists but is not a directory.`);
      }

      // Ensure the path ends with .js
      const servicePath = path.endsWith('.js') ? path : `${path}.js`;
      const serviceName = name.endsWith('.js') ? name : `${name}.js`;

      // Create the service node
      const serviceId = get().createNode(serviceName, 'service', servicePath, {
        fileExtension: 'js',
        content,
        methods: [],
        template: undefined,
      } as ServiceNodeContent);

      // Create the 'contains' edge from services directory to the new service
      get().createEdge(servicesDirNode.id, serviceId, 'contains');

      return serviceId;
    },
  })),
);
