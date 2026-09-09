import { useParams } from 'next/navigation';

// Retrieves the game ID from the route parameters
const useGameId = (): string => {
  const { id } = useParams<{ id: string }>();
  return id;
};

export default useGameId;
