import { WorkflowStep } from '@/features/ollama-api/tool-schemas/workflow-schema';
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Enable MapSet plugin for Immer
enableMapSet();

export type FileType = 'workflow' | 'service';

export interface ServiceMethod {
  name: string;
  content: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  fileType?: FileType;
  children?: FileNode[];
  content?: {
    // For workflow files
    interface?: WorkflowStep;
    steps?: WorkflowStep[];
    // For service files
    template?: string;
    methods?: ServiceMethod[];
  };
}

interface VfsStore {
  files: FileNode;
  selectedFile: string | null;
  expandedDirectories: Set<string>;

  // Actions
  setSelectedFile: (path: string | null) => void;
  toggleDirectory: (path: string) => void;
  isDirectoryExpanded: (path: string) => boolean;

  // Create operations
  createFile: (path: string, name: string, fileType: FileType) => void;
  createDirectory: (path: string, name: string) => void;

  // Read operations
  getWorkflowContent: (path: string) => FileNode['content'] | null;
  getServiceTemplate: (path: string) => string | null;
  getServiceMethods: (path: string) => ServiceMethod[] | null;
  getNode: (path: string) => FileNode | null;

  // Update operations
  commitInterface: (path: string, interfaceData: WorkflowStep) => void;
  commitSteps: (path: string, steps: WorkflowStep[]) => void;
  commitServiceTemplate: (path: string, template: string) => void;
  commitServiceMethod: (path: string, methodName: string, methodContent: string) => void;
  renameNode: (path: string, newName: string) => void;
  moveNode: (fromPath: string, toPath: string) => void;

  // Delete operations
  deleteNode: (path: string) => void;
  deleteMethod: (path: string, methodName: string) => void;
  deleteWorkflowSteps: (path: string) => void;
}

export const useVfsStore = create<VfsStore>()(
  immer((set, get) => ({
    files: {
      name: 'root',
      type: 'directory',
      children: [
        {
          name: 'workflows',
          type: 'directory',
          children: [],
        },
        {
          name: 'services',
          type: 'directory',
          children: [],
        },
      ],
    },
    selectedFile: null,
    expandedDirectories: new Set(['workflows', 'services']),

    setSelectedFile: path =>
      set(state => {
        state.selectedFile = path;
      }),

    toggleDirectory: path =>
      set(state => {
        if (state.expandedDirectories.has(path)) {
          state.expandedDirectories.delete(path);
        } else {
          state.expandedDirectories.add(path);
        }
      }),

    isDirectoryExpanded: path => get().expandedDirectories.has(path),

    // Create operations
    createFile: (path, name, fileType) =>
      set(state => {
        const createNode = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.type !== 'directory') {
              console.warn('Cannot create file in non-directory:', path);
              return false;
            }
            node.children = node.children || [];
            node.children.push({
              name,
              type: 'file',
              fileType,
              content:
                fileType === 'workflow'
                  ? { interface: undefined, steps: undefined }
                  : { template: undefined, methods: [] },
            });
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (createNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        createNode(state.files, '');
      }),

    createDirectory: (path, name) =>
      set(state => {
        // Only allow creating directories within workflows or services
        if (!path.startsWith('/workflows') && !path.startsWith('/services')) {
          console.warn('Can only create directories within workflows or services');
          return;
        }

        const createNode = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.type !== 'directory') {
              console.warn('Cannot create directory in non-directory:', path);
              return false;
            }
            node.children = node.children || [];
            node.children.push({
              name,
              type: 'directory',
              children: [],
            });
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (createNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        createNode(state.files, '');
      }),

    // Read operations
    getNode: path => {
      const findNode = (node: FileNode, currentPath: string): FileNode | null => {
        if (currentPath === path) {
          return node;
        }
        if (node.children) {
          for (const child of node.children) {
            const result = findNode(child, `${currentPath}/${child.name}`);
            if (result) return result;
          }
        }
        return null;
      };
      return findNode(get().files, '');
    },

    getWorkflowContent: path => {
      const findNodeContent = (node: FileNode, currentPath: string): FileNode['content'] | null => {
        if (currentPath === path) {
          if (node.fileType !== 'workflow') {
            console.warn('Trying to get workflow content from non-workflow file:', path);
            return null;
          }
          return node.content || null;
        }
        if (node.children) {
          for (const child of node.children) {
            const result = findNodeContent(child, `${currentPath}/${child.name}`);
            if (result) return result;
          }
        }
        return null;
      };
      return findNodeContent(get().files, '');
    },

    getServiceTemplate: path => {
      const findNodeContent = (node: FileNode, currentPath: string): string | null => {
        if (currentPath === path) {
          if (node.fileType !== 'service') {
            console.warn('Trying to get template from non-service file:', path);
            return null;
          }
          return node.content?.template || null;
        }
        if (node.children) {
          for (const child of node.children) {
            const result = findNodeContent(child, `${currentPath}/${child.name}`);
            if (result) return result;
          }
        }
        return null;
      };
      return findNodeContent(get().files, '');
    },

    getServiceMethods: path => {
      const findNodeContent = (node: FileNode, currentPath: string): ServiceMethod[] | null => {
        if (currentPath === path) {
          if (node.fileType !== 'service') {
            console.warn('Trying to get methods from non-service file:', path);
            return null;
          }
          return node.content?.methods || null;
        }
        if (node.children) {
          for (const child of node.children) {
            const result = findNodeContent(child, `${currentPath}/${child.name}`);
            if (result) return result;
          }
        }
        return null;
      };
      return findNodeContent(get().files, '');
    },

    // Update operations
    renameNode: (path, newName) =>
      set(state => {
        // Prevent renaming root directories
        if (path === '/workflows' || path === '/services') {
          console.warn('Cannot rename root directories');
          return;
        }

        const renameNode = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            node.name = newName;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (renameNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        renameNode(state.files, '');
      }),

    moveNode: (fromPath, toPath) =>
      set(state => {
        // Prevent moving root directories
        if (fromPath === '/workflows' || fromPath === '/services') {
          console.warn('Cannot move root directories');
          return;
        }

        const findNode = (node: FileNode, currentPath: string): FileNode | null => {
          if (currentPath === fromPath) {
            return node;
          }
          if (node.children) {
            for (const child of node.children) {
              const result = findNode(child, `${currentPath}/${child.name}`);
              if (result) return result;
            }
          }
          return null;
        };

        const nodeToMove = findNode(state.files, '');
        if (!nodeToMove) {
          console.warn('Node to move not found:', fromPath);
          return;
        }

        const moveToNode = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === toPath) {
            if (node.type !== 'directory') {
              console.warn('Cannot move to non-directory:', toPath);
              return false;
            }
            node.children = node.children || [];
            node.children.push(nodeToMove);
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (moveToNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };

        // First remove the node from its current location
        const removeNode = (node: FileNode, currentPath: string): boolean => {
          if (node.children) {
            const index = node.children.findIndex(
              child => `${currentPath}/${child.name}` === fromPath,
            );
            if (index !== -1) {
              node.children.splice(index, 1);
              return true;
            }
            for (const child of node.children) {
              if (removeNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };

        removeNode(state.files, '');
        moveToNode(state.files, '');
      }),

    // Delete operations
    deleteNode: path =>
      set(state => {
        // Prevent deleting root directories
        if (path === '/workflows' || path === '/services') {
          console.warn('Cannot delete root directories');
          return;
        }

        const deleteNode = (node: FileNode, currentPath: string): boolean => {
          if (node.children) {
            const index = node.children.findIndex(child => `${currentPath}/${child.name}` === path);
            if (index !== -1) {
              node.children.splice(index, 1);
              return true;
            }
            for (const child of node.children) {
              if (deleteNode(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        deleteNode(state.files, '');
      }),

    deleteMethod: (path, methodName) =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'service') {
              console.warn('Trying to delete method from non-service file:', path);
              return false;
            }
            const methods = node.content?.methods || [];
            const index = methods.findIndex(m => m.name === methodName);
            if (index !== -1) {
              methods.splice(index, 1);
              node.content = { ...node.content, methods };
            }
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),

    deleteWorkflowSteps: path =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'workflow') {
              console.warn('Trying to delete steps from non-workflow file:', path);
              return false;
            }
            node.content = { ...node.content, steps: undefined };
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),

    // Update operations
    commitInterface: (path, interfaceData) =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'workflow') {
              console.warn('Trying to commit interface to non-workflow file:', path);
              return false;
            }
            node.content = { ...node.content, interface: interfaceData };
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),

    commitSteps: (path, steps) =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'workflow') {
              console.warn('Trying to commit steps to non-workflow file:', path);
              return false;
            }
            node.content = { ...node.content, steps };
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),

    commitServiceTemplate: (path, template) =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'service') {
              console.warn('Trying to commit template to non-service file:', path);
              return false;
            }
            node.content = { ...node.content, template };
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),

    commitServiceMethod: (path, methodName, methodContent) =>
      set(state => {
        const updateNodeContent = (node: FileNode, currentPath: string): boolean => {
          if (currentPath === path) {
            if (node.fileType !== 'service') {
              console.warn('Trying to commit method to non-service file:', path);
              return false;
            }
            const methods = node.content?.methods || [];
            const existingMethodIndex = methods.findIndex(m => m.name === methodName);

            if (existingMethodIndex >= 0) {
              methods[existingMethodIndex] = { name: methodName, content: methodContent };
            } else {
              methods.push({ name: methodName, content: methodContent });
            }

            node.content = { ...node.content, methods };
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNodeContent(child, `${currentPath}/${child.name}`)) {
                return true;
              }
            }
          }
          return false;
        };
        updateNodeContent(state.files, '');
      }),
  })),
);
