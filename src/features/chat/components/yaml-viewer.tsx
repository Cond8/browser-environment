// src/features/chat/components/yaml-viewer.tsx
export const YamlViewer = ({ content }: { content: string }) => {
  return (
    <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">
      {content}
    </pre>
  );
};
