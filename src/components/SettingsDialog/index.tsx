import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProxySettingsCard from './ProxySettingsCard';

type SettingsDialogProps = {
  children: ReactNode;
};

export default function SettingsDialog(props: SettingsDialogProps) {
  const { children } = props;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Change the settings of the application.</DialogDescription>
        </DialogHeader>
        <Tabs className="w-full" defaultValue="proxy">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
          </TabsList>
          <TabsContent value="proxy">
            <ProxySettingsCard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
