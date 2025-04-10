// src/App.tsx
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { EditorLayout } from '@/features/panels/components/editor-layout';
import { TopBar } from '@/features/panels/components/topbar';
import { ChatProvider } from '@/features/chat/providers/chat-provider';
import { ChatPage } from '@/features/chat/components/chat-page';

export const App = () => (
  <ChatProvider>
    <ThemeProvider>
      <div className="h-screen w-screen flex flex-col">
        {/* Topbar */}
        <TopBar />

        {/* Main layout */}
        <main className="flex-1 overflow-hidden">
          <ChatPage />
        </main>

        {/* Toast notifications */}
        <Toaster />
      </div>
    </ThemeProvider>
  </ChatProvider>
);

export default App;
