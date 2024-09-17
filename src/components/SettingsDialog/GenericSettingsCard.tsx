import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import useSetting from '@/lib/useSettings';

const genericSchema = z.object({
  timeout: z.coerce.number().int().min(0),
});

export type GenericSettings = z.infer<typeof genericSchema>;

const defaultGenericSettings = Object.freeze<GenericSettings>({
  timeout: 30,
});

export default function GenericSettingsCard() {
  const [generic, save] = useSetting('generic', defaultGenericSettings);
  const form = useForm<GenericSettings>({
    resolver: zodResolver(genericSchema),
    defaultValues: generic,
  });

  useEffect(() => {
    form.reset(generic);
  }, [generic]);

  return (
    <Form {...form}>
      <form
        className="h-full"
        onSubmit={form.handleSubmit(async (values) => {
          const ok = await save(values);

          if (ok) {
            toast.success('Generic settings saved.');
          } else {
            toast.error('Failed to save generic settings.');
          }
        })}
      >
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Generic</CardTitle>
            <CardDescription>Generic settings for the application.</CardDescription>
          </CardHeader>
          <CardContent className="flex grow flex-col gap-2">
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeout (in seconds)</FormLabel>
                  <FormControl>
                    <Input {...field} required type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-row-reverse">
            <Button type="submit">
              <SaveIcon />
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
