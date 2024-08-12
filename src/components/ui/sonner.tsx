import { CircleCheckIcon, CircleXIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';
import Loading from '../Loading';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      {...props}
      icons={{
        success: <CircleCheckIcon />,
        info: <InfoIcon />,
        warning: <TriangleAlertIcon />,
        error: <CircleXIcon />,
        loading: <Loading />,
        ...props.icons,
      }}
    />
  );
};

export { Toaster };
