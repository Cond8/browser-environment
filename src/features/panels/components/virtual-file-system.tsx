// src/features/panels/components/virtual-file-system.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileNode, useVfsStore } from '@/features/vfs/store/vfs-store';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import React from 'react';

interface FileTreeProps {
  node: FileNode;
  level?: number;
  path?: string;
}

const FileTree: React.FC<FileTreeProps> = ({ node, level = 0, path = '' }) => {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  const isExpanded = useVfsStore(state => state.isDirectoryExpanded(currentPath));
  const selectedFile = useVfsStore(state => state.selectedFile);
  const { toggleDirectory, setSelectedFile } = useVfsStore();

  const handleClick = () => {
    if (node.type === 'directory') {
      toggleDirectory(currentPath);
    } else {
      setSelectedFile(currentPath);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer',
          level > 0 && 'ml-4',
          selectedFile === currentPath && 'bg-muted/50',
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 text-muted-foreground" />
          </>
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTree key={index} node={child} level={level + 1} path={currentPath} />
          ))}
        </div>
      )}
    </div>
  );
};

export const VirtualFileSystem: React.FC = () => {
  const files = useVfsStore(state => state.files);

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <FileTree node={files} />
      </div>
    </ScrollArea>
  );
};
