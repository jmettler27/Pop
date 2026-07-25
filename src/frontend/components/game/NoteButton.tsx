import { TriangleAlert } from 'lucide-react';

import { Button } from '@/frontend/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';

export default function NoteButton({ note }: { note: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" />}>
        <TriangleAlert className="text-green-500" />
      </TooltipTrigger>
      <TooltipContent>{note}</TooltipContent>
    </Tooltip>
  );
}
