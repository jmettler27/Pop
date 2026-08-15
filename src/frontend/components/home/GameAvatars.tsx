import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/frontend/components/ui/avatar';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { useAllOrganizersOnce } from '@/frontend/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayersOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';

type AvatarSize = 'small' | 'medium' | 'large';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  small: 'size-[28px] sm:size-[30px] md:size-8 text-xs sm:text-sm md:text-base',
  medium: 'size-8 sm:size-9 md:size-10 text-xs sm:text-sm md:text-base',
  large: 'size-10 sm:size-11 md:size-12 text-xs sm:text-sm md:text-base',
};

interface AvatarGroupPerson {
  id: string | undefined;
  name: string;
  image?: string | null;
}

function PeopleAvatarGroup({ people, max, size }: { people: AvatarGroupPerson[]; max: number; size: AvatarSize }) {
  const sizeClasses = SIZE_CLASSES[size];
  const hasOverflow = people.length > max;
  const visible = hasOverflow ? people.slice(0, max - 1) : people;
  const overflowCount = hasOverflow ? people.length - (max - 1) : 0;

  return (
    <AvatarGroup className="*:data-[slot=avatar]:ring-0">
      {visible.map((person) => (
        <Tooltip key={person.id}>
          <TooltipTrigger
            render={
              <Avatar
                className={`${sizeClasses} border-2 border-[#1e293b] transition-all duration-200 hover:scale-[1.15] hover:z-10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]`}
              />
            }
          >
            <AvatarImage src={person.image ?? undefined} alt={person.name} />
            <AvatarFallback>{person.name?.[0]?.toUpperCase()}</AvatarFallback>
          </TooltipTrigger>
          <TooltipContent>{person.name}</TooltipContent>
        </Tooltip>
      ))}
      {overflowCount > 0 && (
        <AvatarGroupCount className={`${sizeClasses} border-2 border-[#1e293b]`}>+{overflowCount}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

interface GameOrganizersAvatarGroupProps {
  gameId: string;
  max?: number;
  size?: AvatarSize;
}

export function GameOrganizersAvatarGroup({ gameId, max = 4, size = 'medium' }: GameOrganizersAvatarGroupProps) {
  const { organizers, loading, error } = useAllOrganizersOnce(gameId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }
  if (!organizers) {
    return <></>;
  }

  return <PeopleAvatarGroup people={organizers} max={max} size={size} />;
}

interface GamePlayersAvatarGroupProps {
  gameId: string;
  max?: number;
  size?: AvatarSize;
}

export function GamePlayersAvatarGroup({ gameId, max = 4, size = 'medium' }: GamePlayersAvatarGroupProps) {
  const { players, loading, error } = useAllPlayersOnce(gameId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }
  if (!players) {
    return <></>;
  }

  return <PeopleAvatarGroup people={players} max={max} size={size} />;
}
