import type ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useChooser(repo: ChooserRepository | null) {
  const { data, isLoading, error } = useFirestoreDocument(repo?.docRef ?? null);
  return { chooser: data, loading: isLoading, error };
}

export function useCurrentChooser(repo: ChooserRepository | null) {
  const { chooser, loading, error } = useChooser(repo);
  if (loading || error || !chooser) {
    return { currentChooserTeamId: null, loading, error };
  }
  const chooserOrder = chooser.chooserOrder as string[];
  const chooserIdx = chooser.chooserIdx as number;
  return { currentChooserTeamId: chooserOrder[chooserIdx], loading, error };
}

export function useIsChooser(repo: ChooserRepository | null, teamId: string) {
  const { currentChooserTeamId, loading, error } = useCurrentChooser(repo);
  if (loading || error) {
    return { isChooser: false, loading, error };
  }
  return { isChooser: teamId === currentChooserTeamId, loading, error };
}
