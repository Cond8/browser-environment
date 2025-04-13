// src/features/panels/components/virtual-file-system.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node, useVfsStore } from '@/features/vfs/store/vfs-store';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder, Server, Workflow } from 'lucide-react';
import React from 'react';

interface FileTreeProps {
  node: Node;
  level?: number;
}

const FileTree: React.FC<FileTreeProps> = ({ node, level = 0 }) => {
  const isExpanded = useVfsStore(state => state.isNodeExpanded(node.id));
  const selectedNode = useVfsStore(state => state.selectedNode);
  const { toggleNode, setSelectedNode } = useVfsStore();

  const handleClick = () => {
    if (node.type === 'directory') {
      toggleNode(node.id);
    } else {
      setSelectedNode(node.id);
    }
  };

  const getIcon = () => {
    if (node.type === 'directory') {
      return <Folder className="h-4 w-4 text-muted-foreground" />;
    } else if (node.type === 'workflow') {
      return <Workflow className="h-4 w-4 text-blue-500" />;
    } else if (node.type === 'service') {
      return <Server className="h-4 w-4 text-green-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  // Get child nodes through edges
  const childNodes = useVfsStore(state => {
    const edges = state.getEdges(node.id, 'contains');
    return edges
      .map(edge => state.getNode(edge.target))
      .filter((node): node is Node => node !== null);
  });

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer',
          level > 0 && 'ml-4',
          selectedNode === node.id && 'bg-muted/50',
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        {node.type === 'directory' && (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </>
        )}
        {getIcon()}
        <span className="text-sm">{node.name}</span>
      </div>
      {isExpanded && childNodes.length > 0 && (
        <div>
          {childNodes.map(child => (
            <FileTree key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const VirtualFileSystem: React.FC = () => {
  const rootNodes = useVfsStore(state => {
    // Get all nodes that are not targets of any 'contains' edge
    const allNodes = Array.from(state.nodes.values());
    const targetNodeIds = new Set(
      Array.from(state.edges.values())
        .filter(edge => edge.type === 'contains')
        .map(edge => edge.target),
    );
    return allNodes.filter(node => !targetNodeIds.has(node.id));
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {rootNodes.map(node => (
          <FileTree key={node.id} node={node} />
        ))}
      </div>
    </ScrollArea>
  );
};
