import type TimerRepository from '@/backend/repositories/timer/TimerRepository';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type Timer } from '@/models/timer';

export function useTimer(repo: TimerRepository | null) {
  const { data, isLoading, error } = useFirestoreDocument(repo?.docRef ?? null);
  return { timer: data ? (data as unknown as Timer) : null, timerLoading: isLoading, timerError: error };
}

export function useTimerOnce(repo: TimerRepository | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo?.docRef ?? null);
  return { timer: data ? (data as unknown as Timer) : null, timerLoading: isLoading, timerError: error };
}
