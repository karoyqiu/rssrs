import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { PlusIcon, RefreshCwIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { createCallable } from 'react-call';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4-mini';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type Seed, commands } from '@/lib/bindings';
import { cn } from '@/lib/utils';

const seedSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name is required.')),
  url: z.url(),
});
type seedType = z.infer<typeof seedSchema>;

type SeedDialogProps = {
  seed?: Pick<Seed, 'id' | 'name' | 'url'>;
};

const SeedDialog = createCallable<SeedDialogProps>(({ seed, call }) => {
  const [isFetching, setIsFetching] = useState(false);
  const form = useForm<seedType>({
    resolver: standardSchemaResolver(seedSchema),
    defaultValues: {
      name: seed?.name ?? '',
      url: seed?.url ?? '',
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  const fetchNow = form.handleSubmit(async (values) => {
    if (!seed) return;

    setIsFetching(true);
    try {
      if (isDirty) {
        const saved = await commands.dbUpdateSeed(seed.id, values.name, values.url);
        if (!saved) {
          toast.error('Failed to save seed.');
          return;
        }
        form.reset(values);
      }

      try {
        await commands.fetchSeed(seed.id);
        toast.success('Seed fetched successfully.');
      } catch (err) {
        toast.error(`Failed to fetch seed: ${String(err)}`);
      }
    } catch (err) {
      toast.error(`Failed to save seed: ${String(err)}`);
    } finally {
      setIsFetching(false);
    }
  });

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seed ? 'Edit seed' : 'Add seed'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            autoComplete="off"
            onSubmit={form.handleSubmit(async (values) => {
              const { name, url } = values;
              const command = seed
                ? commands.dbUpdateSeed(seed.id, name, url)
                : commands.dbInsertSeed(name, url);
              const result = await command;

              if (result) {
                call.end();
              } else {
                toast.error(seed ? 'Failed to save seed.' : 'Failed to add seed.');
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">Name</FormLabel>
                  <FormControl>
                    <Input required disabled={isFetching} {...field} />
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
                  <FormLabel className="required">URL</FormLabel>
                  <FormControl>
                    <Input required type="url" disabled={isFetching} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 flex gap-2">
              {seed ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isFetching || isSubmitting}
                    onClick={async () => {
                      const result = await commands.dbDeleteSeed(seed.id);

                      if (result) {
                        call.end();
                      } else {
                        toast.error('Failed to delete seed.');
                      }
                    }}
                  >
                    <TrashIcon />
                    Delete
                  </Button>
                  <Button
                    className="ml-auto"
                    type="button"
                    variant="outline"
                    disabled={isFetching || isSubmitting}
                    aria-busy={isFetching}
                    onClick={fetchNow}
                  >
                    <RefreshCwIcon className={cn(isFetching && 'animate-spin')} />
                    Fetch now
                  </Button>
                  <Button type="submit" disabled={isFetching || isSubmitting}>
                    <SaveIcon />
                    Save
                  </Button>
                </>
              ) : (
                <Button className="ml-auto" type="submit">
                  <PlusIcon />
                  Add
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default SeedDialog;
