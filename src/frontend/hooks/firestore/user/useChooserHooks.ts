import { doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useChooser(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId ? doc(firestore, 'games', gameId, 'realtime', 'states') : null
  );
  return { chooser: data, loading: isLoading, error };
}

export function useCurrentChooser(gameId: string | null) {
  const { chooser, loading, error } = useChooser(gameId);
  if (loading || error || !chooser) {
    return { currentChooserTeamId: null, loading, error };
  }
  const chooserOrder = chooser.chooserOrder as string[];
  const chooserIdx = chooser.chooserIdx as number;
  return { currentChooserTeamId: chooserOrder[chooserIdx], loading, error };
}

export function useIsChooser(gameId: string | null, teamId: string) {
  const { currentChooserTeamId, loading, error } = useCurrentChooser(gameId);
  if (loading || error) {
    return { isChooser: false, loading, error };
  }
  return { isChooser: teamId === currentChooserTeamId, loading, error };
}
