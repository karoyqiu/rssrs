import { Button } from '@/components/ui/button';
import { appWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';

import './globals.css';

function App() {
  useEffect(() => {
    appWindow.show();
  }, []);

  return (
    <div>
      <Button>Hello!</Button>
    </div>
  );
}

export default App;
