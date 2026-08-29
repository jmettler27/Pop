import { useSession } from 'next-auth/react';

// Retrieves the ID of the currently authenticated user, if any
const useUserId = (): string | undefined => {
  const { data: session } = useSession();
  return session?.user?.id;
};

export default useUserId;
