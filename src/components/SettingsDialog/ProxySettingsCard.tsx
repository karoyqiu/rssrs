import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export type ProxySettings = {
  type: 'none' | 'sys' | 'http';
  host: string;
  port: number;
};

export default function ProxySettingsCard() {
  const id = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proxy</CardTitle>
        <CardDescription>Use a proxy to access the internet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id={`${id}none`} />
            <Label htmlFor={`${id}none`}>Do not use proxy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sys" id={`${id}sys`} />
            <Label htmlFor={`${id}sys`}>Use system proxy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="http" id={`${id}man`} />
            <Label htmlFor={`${id}man`}>Use the proxy blow</Label>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  );
}
