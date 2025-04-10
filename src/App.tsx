// src/App.tsx
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { EditorLayout } from '@/features/panels/components/editor-layout';
import { TopBar } from '@/features/panels/components/topbar';

export const App = () => (
  <ThemeProvider>
    <div className="h-screen w-screen flex flex-col">
      {/* Topbar */}
      <TopBar />

      {/* Main layout */}
      <main className="flex-1 overflow-hidden">
        <EditorLayout />
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  </ThemeProvider>
);

export default App;
