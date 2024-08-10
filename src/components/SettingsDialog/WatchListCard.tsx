import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useWatchList from '@/lib/useWatchList';

export default function WatchListCard() {
  const { keywords } = useWatchList();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Watch list</CardTitle>
        <CardDescription>Watch articals whose title includes specific keywords.</CardDescription>
      </CardHeader>
      <CardContent className="flex grow flex-col gap-2"></CardContent>
    </Card>
  );
}
