import { zodResolver } from '@hookform/resolvers/zod';
import { EditIcon, Loader2Icon, RotateCwIcon, SaveIcon } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
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
import { type Seed, dbUpdateSeed, fetchSeed } from '@/lib/bindings';

import { type AddSeedType, addSeedSchema } from './AddSeedDialog';

type EditSeedDialogProps = {
  seed: Pick<Seed, 'id' | 'name' | 'url'>;
  children: ReactNode;
};

export default function EditSeedDialog(props: EditSeedDialogProps) {
  const { seed, children } = props;
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const form = useForm<AddSeedType>({
    resolver: zodResolver(addSeedSchema),
    defaultValues: seed,
  });

  useEffect(() => {
    setFetching(false);
  }, [seed.id]);

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
            className="flex flex-col gap-4"
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
            <div className="flex justify-between">
              <Button
                variant="secondary"
                type="button"
                disabled={fetching}
                onClick={async () => {
                  setFetching(true);
                  await fetchSeed(seed.id);
                  setFetching(false);
                }}
              >
                {fetching ? <Loader2Icon className="animate-spin" /> : <RotateCwIcon />}
                Fetch now
              </Button>
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
