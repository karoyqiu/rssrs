import { appWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';

import { PlusIcon } from 'lucide-react';
import AddSeedDialog from './components/AddSeedDialog';
import { Button } from './components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { ScrollArea } from './components/ui/scroll-area';
import './globals.css';

function App() {
  useEffect(() => {
    appWindow.show();
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId="root">
      <ResizablePanel defaultSize={20} minSize={10}>
        <ScrollArea>
          <div className="flex items-center justify-between p-2">
            <span className="text-sm text-muted-foreground">Seeds</span>
            <AddSeedDialog>
              <Button variant="ghost" size="icon">
                <PlusIcon />
              </Button>
            </AddSeedDialog>
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={50}>Main</ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
