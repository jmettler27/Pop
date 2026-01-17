'use server';

import { firestore } from '@/backend/firebase/firebase';
import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore';

import { getNextCyclicIndex, shuffle } from '@/backend/utils/arrays';
import { getDocDataTransaction } from '@/backend/services/utils';
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';

import { PlayerStatus } from '@/backend/models/users/Player';

export const resetGameChooserTransaction = async (transaction, gameId) => {
  const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams');
  const teamsSnapshot = await getDocs(query(teamsCollectionRef));

  // Create an array of random ids for the teams
  const teamIds = teamsSnapshot.docs.map((doc) => doc.id);
  const shuffledTeamIds = shuffle(teamIds);

  const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
  transaction.update(chooserRef, {
    chooserIdx: 0,
    chooserOrder: shuffledTeamIds,
  });
};

/* ==================================================================================================== */

export const switchNextChooserTransaction = async (transaction, gameId, focus = true) => {
  const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
  const chooserData = await getDocDataTransaction(transaction, chooserRef);
  const { chooserOrder, chooserIdx } = chooserData;

  const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
  transaction.update(chooserRef, {
    chooserIdx: newChooserIdx,
  });
  const newChooserTeamId = chooserOrder[newChooserIdx];
  console.log('New chooser team:', newChooserTeamId);

  if (!focus) return;

  console.log('Updating player statuses...');
  const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players');
  const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)));
  for (const playerDoc of choosersSnapshot.docs) {
    transaction.update(playerDoc.ref, {
      status: PlayerStatus.FOCUS,
    });
  }
};
