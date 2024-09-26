import { zodResolver } from '@hookform/resolvers/zod';
import { EditIcon, SaveIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { dbUpdateSeed, type Seed } from '@/lib/bindings';
import { addSeedSchema, type AddSeedType } from './AddSeedDialog';

type EditSeedDialogProps = {
  seed: Pick<Seed, 'id' | 'name' | 'url'>;
  children: ReactNode;
};

export default function EditSeedDialog(props: EditSeedDialogProps) {
  const { seed, children } = props;
  const [open, setOpen] = useState(false);
  const form = useForm<AddSeedType>({
    resolver: zodResolver(addSeedSchema),
    defaultValues: seed,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <ContextMenu>
        <ContextMenuTrigger className="w-full">{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <DialogTrigger asChild>
            <ContextMenuItem className="gap-2">
              <EditIcon />
              Edit
            </ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit seed</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(async (values) => {
              const { name, url } = values;
              const result = await dbUpdateSeed(seed.id, name, url);

              if (result) {
                setOpen(false);
              } else {
                toast.error('Failed to save seed.');
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input required type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row-reverse">
              <Button type="submit">
                <SaveIcon />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
