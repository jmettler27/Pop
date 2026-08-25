import { memo, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

import sounds from '@/data/sounds';
import { GAMES_COLLECTION_REF } from '@/firebase/firestore';
import { Button } from '@/frontend/components/ui/button';
import { Slider } from '@/frontend/components/ui/slider';

const initVolume = 0.4;

const SoundboardAudioPlayer = memo(function SoundboardAudioPlayer() {
  const { id } = useParams();
  const gameId = id as string;
  const [volume, setVolume] = useState(initVolume);

  // Ref so the onSnapshot callback always reads the latest volume without needing to re-subscribe.
  const volumeRef = useRef(volume);

  // Sounds blocked by the browser's autoplay policy; drained on the next user gesture.
  const pendingSoundsRef = useRef<string[]>([]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Plays any sounds that were buffered because the browser had not yet received a user gesture.
  const playPending = () => {
    const pending = pendingSoundsRef.current.splice(0);
    pending.forEach((url) => {
      const a = new Audio(url);
      a.volume = volumeRef.current;
      a.play().catch(() => {});
    });
  };

  useEffect(() => {
    // Scoped to sounds queued from this mount onward — without the `where`, a client that attaches
    // partway through a game (a refresh, a reconnect, a late-joining spectator) would be billed a read
    // for every sound event queued since the game started, not just new ones. `isInitialLoad` below is
    // kept as a second guard for the (tiny) race between capturing `now` and the listener attaching
    // server-side.
    const q = query(
      collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue'),
      where('timestamp', '>', Timestamp.now())
    );
    let isInitialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip the first snapshot: Firestore reports all pre-existing docs as 'added' on subscribe,
      // which would play every sound queued since the last reset for players joining mid-game.
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') {
          return;
        }
        const { filename } = change.doc.data() as { filename: string };
        const soundEntry = (sounds as Record<string, { url: string }>)[filename];
        if (!soundEntry) {
          return;
        }
        const audio = new Audio(soundEntry.url);
        audio.volume = volumeRef.current;
        // play() may reject if no user gesture has occurred yet (browser autoplay policy).
        // Buffer the URL so it can be retried on the next interaction with the volume controls.
        audio.play().catch(() => {
          pendingSoundsRef.current.push(soundEntry.url);
        });
      });
    });
    return () => unsubscribe();
  }, [gameId]);

  const handleVolumeChange = (value: number | readonly number[]) => {
    setVolume(Array.isArray(value) ? value[0]! : (value as number));
    playPending();
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-row items-center gap-4 mb-2 px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="play/pause"
          className="text-primary"
          onClick={() => {
            setVolume((v) => (v === 0 ? initVolume : 0));
            playPending();
          }}
        >
          {volume === 0 ? <VolumeX /> : volume < 0.5 ? <Volume1 /> : <Volume2 />}
        </Button>

        <Slider
          aria-label="Volume"
          orientation="horizontal"
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
        />
      </div>
    </div>
  );
});

export default SoundboardAudioPlayer;
