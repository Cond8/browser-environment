// src/features/vfs/store/vfs-store.ts
import { WorkflowStep } from '@/features/ollama-api/tool-schemas/workflow-schema';
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Enable MapSet plugin for Immer
enableMapSet();

// Error handling infrastructure
export type ErrorLevel = 'error' | 'warn' | 'info';
export type ErrorSource = 'vfs' | 'workflow' | 'service' | 'edge' | 'node';

export interface ErrorOptions {
  level?: ErrorLevel;
  source?: ErrorSource;
  metadata?: Record<string, any>;
  originalError?: Error;
}

export class VfsError extends Error {
  level: ErrorLevel;
  source: ErrorSource;
  timestamp: Date;
  metadata?: Record<string, any>;
  originalError?: Error;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = 'VfsError';
    this.level = options.level || 'error';
    this.source = options.source || 'vfs';
    this.timestamp = new Date();
    this.metadata = options.metadata;
    this.originalError = options.originalError;
  }

  // Convert error to a friendly string for logging
  toString(): string {
    return `[${this.source.toUpperCase()}] ${this.message}`;
  }

  // Format error as JSON for developers
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      level: this.level,
      source: this.source,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata || {},
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : null,
      stack: this.stack,
    };
  }
}

// Enable or disable verbose logging in development
const VERBOSE_ERROR_LOGGING = process.env.NODE_ENV !== 'production';

const logError = (error: VfsError | Error) => {
  if (error instanceof VfsError) {
    const { level, source, metadata, originalError } = error;
    console[level](`[${source.toUpperCase()}] ${error.message}`, {
      timestamp: error.timestamp,
      metadata,
      originalError,
      stack: error.stack,
    });
  } else {
    console.error('[VFS] Unhandled error:', error);
  }

  // In production you might want to send errors to a monitoring service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorMonitoring(error);
  // }
};

// Developer utilities for debugging
const errorUtils = {
  // Format all errors in a readable way for debugging
  formatErrorHistory: (errors: VfsError[]): string => {
    if (errors.length === 0) {
      return 'No errors recorded.';
    }

    return errors
      .map((err, index) => {
        const timestamp = err.timestamp.toLocaleTimeString();
        return `${index + 1}. [${timestamp}] [${err.level.toUpperCase()}] [${err.source}] ${err.message}`;
      })
      .join('\n');
  },

  // Get JSON representation of errors for developer tools
  getErrorsAsJSON: (errors: VfsError[]): Record<string, any>[] => {
    return errors.map(err => err.toJSON());
  },

  // Log the full error stack trace in development
  debugLogError: (error: VfsError, verbose = VERBOSE_ERROR_LOGGING): void => {
    if (!verbose) return;

    console.group(`🐞 VFS Error Debug: ${error.message}`);
    console.log('Error Source:', error.source);
    console.log('Error Level:', error.level);
    console.log('Timestamp:', error.timestamp.toISOString());

    if (error.metadata && Object.keys(error.metadata).length > 0) {
      console.group('Metadata:');
      Object.entries(error.metadata).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      console.groupEnd();
    }

    if (error.originalError) {
      console.group('Original Error:');
      console.log('Name:', error.originalError.name);
      console.log('Message:', error.originalError.message);
      console.log('Stack:', error.originalError.stack);
      console.groupEnd();
    }

    console.log('Stack Trace:', error.stack);
    console.groupEnd();
  },
};

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

  // Error tracking
  errors: VfsError[];
  lastError: VfsError | null;
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

  // Error handling
  handleError: (message: string, options?: ErrorOptions) => VfsError;
  clearErrors: () => void;
  getLastError: () => VfsError | null;
  getAllErrors: () => VfsError[];

  // Developer utilities
  getErrorsFormatted: () => string;
  getErrorsAsJSON: () => Record<string, any>[];
  filterErrorsBySource: (source: ErrorSource) => VfsError[];
  filterErrorsByLevel: (level: ErrorLevel) => VfsError[];
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
    errors: [],
    lastError: null,

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
      try {
        if (get().pathIndex.has(path)) {
          const error = get().handleError(`Path "${path}" already exists.`, {
            source: 'node',
            metadata: { name, type, path },
          });
          throw error;
        }
        const nodeId = crypto.randomUUID();
        const newNode: Node<T> = { id: nodeId, name, type, path, content };

        set(state => {
          state.nodes.set(nodeId, newNode as Node);
          state.pathIndex.set(path, nodeId);
          state.stateVersion++;
        });
        return nodeId;
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to create node: ${(err as Error).message}`, {
            source: 'node',
            level: 'error',
            originalError: err as Error,
            metadata: { name, type, path },
          });
        }
        throw err;
      }
    },

    renameNode: (nodeId, newName, newPath) =>
      set(state => {
        try {
          const node = state.nodes.get(nodeId);
          if (!node) {
            const error = get().handleError(`Node with ID ${nodeId} not found.`, {
              source: 'node',
              metadata: { nodeId, newName, newPath },
            });
            throw error;
          }

          // Handle path change if provided
          if (newPath && newPath !== node.path) {
            if (state.pathIndex.has(newPath)) {
              const error = get().handleError(`New path "${newPath}" already exists.`, {
                source: 'node',
                metadata: { nodeId, newName, newPath, oldPath: node.path },
              });
              throw error;
            }
            // Update path index
            state.pathIndex.delete(node.path);
            state.pathIndex.set(newPath, nodeId);
            node.path = newPath;

            // If this is a directory, we should update paths of all children
            if (node.type === 'directory') {
              try {
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
              } catch (err) {
                get().handleError(`Failed to update child paths: ${(err as Error).message}`, {
                  source: 'node',
                  level: 'error',
                  originalError: err as Error,
                  metadata: { nodeId, oldPath: node.path, newPath },
                });
              }
            }
          }

          // Update name
          node.name = newName;
          state.stateVersion++;
        } catch (err) {
          if (!(err instanceof VfsError)) {
            get().handleError(`Failed to rename node: ${(err as Error).message}`, {
              source: 'node',
              level: 'error',
              originalError: err as Error,
              metadata: { nodeId, newName, newPath },
            });
          }
          throw err;
        }
      }),

    deleteNode: nodeId =>
      set(state => {
        try {
          const node = state.nodes.get(nodeId);
          if (!node) {
            get().handleError(`Node with ID ${nodeId} not found.`, {
              source: 'node',
              level: 'warn',
              metadata: { nodeId },
            });
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
        } catch (err) {
          get().handleError(`Failed to delete node: ${(err as Error).message}`, {
            source: 'node',
            level: 'error',
            originalError: err as Error,
            metadata: { nodeId },
          });
          throw err;
        }
      }),

    createDirectory: (name, path) => {
      try {
        // Basic check for parent existence
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        if (path !== '/' && parentPath !== '/' && !get().pathIndex.has(parentPath)) {
          get().handleError(
            `Parent directory "${parentPath}" does not exist for path "${path}". Creating parents automatically.`,
            {
              source: 'node',
              level: 'warn',
              metadata: { name, path, parentPath },
            },
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
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to create directory: ${(err as Error).message}`, {
            source: 'node',
            level: 'error',
            originalError: err as Error,
            metadata: { name, path },
          });
        }
        throw err;
      }
    },

    // --- Edge operations ---
    createEdge: (source, target, type, properties) => {
      try {
        const sourceNode = get().nodes.get(source);
        const targetNode = get().nodes.get(target);

        if (!sourceNode) {
          const error = get().handleError(`Source node with ID ${source} not found.`, {
            source: 'edge',
            metadata: { source, target, type, properties },
          });
          throw error;
        }
        if (!targetNode) {
          const error = get().handleError(`Target node with ID ${target} not found.`, {
            source: 'edge',
            metadata: { source, target, type, properties },
          });
          throw error;
        }

        // Add validation based on edge type and node types
        if (type === 'contains' && sourceNode.type !== 'directory') {
          const error = get().handleError(
            `'contains' edge should originate from a directory node (source: ${source}).`,
            {
              source: 'edge',
              metadata: { source, sourceType: sourceNode.type, target, type },
            },
          );
          throw error;
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
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to create edge: ${(err as Error).message}`, {
            source: 'edge',
            level: 'error',
            originalError: err as Error,
            metadata: { source, target, type },
          });
        }
        throw err;
      }
    },

    deleteEdge: edgeId =>
      set(state => {
        try {
          if (!state.edges.has(edgeId)) {
            get().handleError(`Edge with ID ${edgeId} not found.`, {
              source: 'edge',
              level: 'warn',
              metadata: { edgeId },
            });
            return; // Idempotent
          }
          state.edges.delete(edgeId);
          state.stateVersion++;
        } catch (err) {
          get().handleError(`Failed to delete edge: ${(err as Error).message}`, {
            source: 'edge',
            level: 'error',
            originalError: err as Error,
            metadata: { edgeId },
          });
          throw err;
        }
      }),

    // --- Content operations ---
    updateWorkflowContent: (nodeId, content) =>
      set(state => {
        try {
          const node = state.nodes.get(nodeId);
          if (!node) {
            const error = get().handleError(`Node with ID ${nodeId} not found.`, {
              source: 'workflow',
              metadata: { nodeId },
            });
            throw error;
          }
          if (node.type !== 'workflow') {
            const error = get().handleError(
              `Node ${nodeId} is type "${node.type}", expected "workflow".`,
              {
                source: 'workflow',
                metadata: { nodeId, actualType: node.type },
              },
            );
            throw error;
          }
          // Type assertion needed because Immer/Zustand struggle with the generic Node<T> inside the update
          const workflowNode = node as Node<'workflow'>;
          workflowNode.content = { ...workflowNode.content, ...content };
          state.stateVersion++;
        } catch (err) {
          if (!(err instanceof VfsError)) {
            get().handleError(`Failed to update workflow content: ${(err as Error).message}`, {
              source: 'workflow',
              level: 'error',
              originalError: err as Error,
              metadata: { nodeId, content },
            });
          }
          throw err;
        }
      }),

    updateServiceContent: (nodeId, content) =>
      set(state => {
        try {
          const node = state.nodes.get(nodeId);
          if (!node) {
            const error = get().handleError(`Node with ID ${nodeId} not found.`, {
              source: 'service',
              metadata: { nodeId },
            });
            throw error;
          }
          if (node.type !== 'service') {
            const error = get().handleError(
              `Node ${nodeId} is type "${node.type}", expected "service".`,
              {
                source: 'service',
                metadata: { nodeId, actualType: node.type },
              },
            );
            throw error;
          }
          const serviceNode = node as Node<'service'>;
          serviceNode.content = { ...serviceNode.content, ...content } as ServiceNodeContent;
          state.stateVersion++;
        } catch (err) {
          if (!(err instanceof VfsError)) {
            get().handleError(`Failed to update service content: ${(err as Error).message}`, {
              source: 'service',
              level: 'error',
              originalError: err as Error,
              metadata: { nodeId, content },
            });
          }
          throw err;
        }
      }),

    // --- Workflow operations ---
    createWorkflow: interfaceData => {
      try {
        const workflowsDirPath = '/workflows';
        let workflowsDirNode = get().getNodeByPath(workflowsDirPath);

        // Create workflows directory if it doesn't exist
        if (!workflowsDirNode) {
          const workflowsDirId = get().createDirectory('workflows', workflowsDirPath);
          workflowsDirNode = get().getNode(workflowsDirId)!; // Should exist now
        } else if (workflowsDirNode.type !== 'directory') {
          // Handle case where /workflows exists but isn't a directory
          const error = get().handleError(
            `Path "${workflowsDirPath}" exists but is not a directory.`,
            {
              source: 'workflow',
              metadata: { path: workflowsDirPath, actualType: workflowsDirNode.type },
            },
          );
          throw error;
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
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to create workflow: ${(err as Error).message}`, {
            source: 'workflow',
            level: 'error',
            originalError: err as Error,
            metadata: { interfaceData },
          });
        }
        throw err;
      }
    },

    addStepsToWorkflow: (workflowId, steps) => {
      try {
        // Use updateWorkflowContent for consistency and type safety
        const currentNode = get().getNode(workflowId);
        if (!currentNode || currentNode.type !== 'workflow') {
          const error = get().handleError(
            `Workflow node with ID ${workflowId} not found or not a workflow.`,
            {
              source: 'workflow',
              metadata: { workflowId, nodeType: currentNode?.type },
            },
          );
          throw error;
        }
        // Get existing steps to append, or initialize if undefined
        const existingSteps = (currentNode.content as WorkflowNodeContent)?.steps || [];
        get().updateWorkflowContent(workflowId, { steps: [...existingSteps, ...steps] });
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to add steps to workflow: ${(err as Error).message}`, {
            source: 'workflow',
            level: 'error',
            originalError: err as Error,
            metadata: { workflowId, steps },
          });
        }
        throw err;
      }
    },

    getContent: (filepath: string) => {
      try {
        const node = get().getNodeByPath(filepath);
        if (!node) {
          const error = get().handleError(`Node with path "${filepath}" not found.`, {
            source: 'vfs',
            metadata: { filepath },
          });
          throw error;
        }

        if (node.type === 'service' && (node.content as ServiceNodeContent)?.content) {
          return (node.content as ServiceNodeContent).content;
        } else if (node.type === 'workflow') {
          return JSON.stringify(node.content as WorkflowNodeContent, null, 2);
        } else {
          get().handleError(`Node type ${node.type} does not support content retrieval.`, {
            source: 'vfs',
            level: 'warn',
            metadata: { filepath, nodeType: node.type },
          });
          return '';
        }
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to get content: ${(err as Error).message}`, {
            source: 'vfs',
            level: 'error',
            originalError: err as Error,
            metadata: { filepath },
          });
        }
        throw err;
      }
    },

    // --- New actions ---
    createService: (name, path, content) => {
      try {
        const servicesDirPath = '/services';
        let servicesDirNode = get().getNodeByPath(servicesDirPath);

        // Create services directory if it doesn't exist
        if (!servicesDirNode) {
          const servicesDirId = get().createDirectory('services', servicesDirPath);
          servicesDirNode = get().getNode(servicesDirId)!;
        } else if (servicesDirNode.type !== 'directory') {
          const error = get().handleError(
            `Path "${servicesDirPath}" exists but is not a directory.`,
            {
              source: 'service',
              metadata: { path: servicesDirPath, actualType: servicesDirNode.type },
            },
          );
          throw error;
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
      } catch (err) {
        if (!(err instanceof VfsError)) {
          get().handleError(`Failed to create service: ${(err as Error).message}`, {
            source: 'service',
            level: 'error',
            originalError: err as Error,
            metadata: { name, path },
          });
        }
        throw err;
      }
    },

    // Error handling
    handleError: (message, options = {}) => {
      const error = new VfsError(message, options);
      logError(error);

      // In development, also use detailed debug logging
      if (process.env.NODE_ENV !== 'production') {
        errorUtils.debugLogError(error);
      }

      set(state => {
        state.errors.push(error);
        state.lastError = error;
      });

      return error;
    },

    clearErrors: () =>
      set(state => {
        state.errors = [];
        state.lastError = null;
      }),

    getLastError: () => get().lastError,

    getAllErrors: () => get().errors,

    // Developer utilities
    getErrorsFormatted: () => errorUtils.formatErrorHistory(get().errors),

    getErrorsAsJSON: () => errorUtils.getErrorsAsJSON(get().errors),

    filterErrorsBySource: (source: ErrorSource) =>
      get().errors.filter(error => error.source === source),

    filterErrorsByLevel: (level: ErrorLevel) => get().errors.filter(error => error.level === level),
  })),
);
