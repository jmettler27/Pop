import { useEffect, useRef, useState } from 'react';

import { FastForward, Music2, Pause, Play, Rewind, Volume2, VolumeX } from 'lucide-react';

import NextImage from '@/components/common/NextImage';
import CurrentRoundQuestionOrder from '@/components/game/main-pane/question/QuestionHeader';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/helpers/question';
import useGame from '@/hooks/useGame';
import { cn } from '@/lib/utils';
import { GameStatus } from '@/models/games/game-status';
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { questionTypeToTitle } from '@/models/questions/question-type';

interface BlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

export default function BlindtestMainContent({ baseQuestion }: BlindtestMainContentProps) {
  const game = useGame();
  if (!game) return null;

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && <ActiveBlindtestMainContent baseQuestion={baseQuestion} />}
      {game.status === GameStatus.QUESTION_END && <EndedBlindtestMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

const DEFAULT_VOLUME = 0.25;

interface ActiveBlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

function ActiveBlindtestMainContent({ baseQuestion }: ActiveBlindtestMainContentProps) {
  const game = useGame();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(Number(localStorage.getItem('volume')) || DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.autoplay = true;

    if (game!.status === GameStatus.QUESTION_END) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [game, volume]);

  const formatTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const secondLeft = Math.floor((time - minute * 60) % 60);
    return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
  };

  const handlePlayPauseReplay = () => {
    if (!audioRef.current) return;
    if (currentTime < duration) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handleTimeChange = (value: number | readonly number[]) => {
    if (!audioRef.current) return;
    const v = Array.isArray(value) ? value[0]! : (value as number);
    audioRef.current.currentTime = v;
    setCurrentTime(v);
  };

  const handleVolumeChange = (value: number | readonly number[]) => {
    if (!audioRef.current) return;
    const v = Array.isArray(value) ? value[0]! : (value as number);
    audioRef.current.volume = v;
    localStorage.setItem('volume', String(v));
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || DEFAULT_VOLUME;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const hasEnded = duration > 0 && currentTime >= duration;

  return (
    <div className="w-full overflow-hidden">
      <div className="relative z-1 mx-auto w-[420px] max-w-full rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl 2xl:w-[600px] 2xl:p-8">
        <audio
          ref={audioRef}
          src={baseQuestion.audio}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Track info */}
        <div className="flex items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/40 to-indigo-500/40 shadow-inner 2xl:size-24">
            <Music2 className={cn('size-7 text-white/90 2xl:size-11', isPlaying && !hasEnded && 'animate-pulse')} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium tracking-widest text-white/50 uppercase 2xl:text-base">
              {game?.title}
            </p>
            <p className="truncate text-xl font-semibold text-white 2xl:text-3xl">
              {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
            </p>
          </div>
        </div>

        {/* Time slider */}
        <div className="mt-6 2xl:mt-10">
          <Slider aria-label="Time" value={[currentTime]} min={0} max={duration} onValueChange={handleTimeChange} />
          <div className="mt-1.5 flex items-center justify-between text-xs tabular-nums text-white/40 2xl:text-base">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="mt-4 flex items-center justify-center gap-4 2xl:mt-8 2xl:gap-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="fast rewind"
            className="size-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white 2xl:size-14"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime -= 10;
            }}
          >
            <Rewind className="size-5 2xl:size-7" />
          </Button>

          <Button
            aria-label={hasEnded ? 'replay' : isPlaying ? 'pause' : 'play'}
            onClick={handlePlayPauseReplay}
            className="size-14 rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 hover:bg-white/90 active:scale-95 2xl:size-20"
          >
            {!hasEnded && isPlaying ? (
              <Pause className="size-6 fill-current 2xl:size-9" />
            ) : (
              <Play className="size-6 translate-x-0.5 fill-current 2xl:size-9" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="fast forward"
            className="size-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white 2xl:size-14"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime += 10;
            }}
          >
            <FastForward className="size-5 2xl:size-7" />
          </Button>
        </div>

        {/* Volume controller */}
        <div className="mt-6 flex items-center gap-3 px-1 2xl:mt-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isMuted || volume === 0 ? 'unmute' : 'mute'}
            className="size-7 shrink-0 text-white/50 hover:text-white 2xl:size-10"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="size-4 2xl:size-6" />
            ) : (
              <Volume2 className="size-4 2xl:size-6" />
            )}
          </Button>
          <Slider
            aria-label="Volume"
            orientation="horizontal"
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}

interface EndedBlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

function EndedBlindtestMainContent({ baseQuestion }: EndedBlindtestMainContentProps) {
  const { image, title, author, source } = baseQuestion.answer ?? {};

  if (!image) {
    return (
      <div className="flex flex-col h-3/4 w-[90%] items-center justify-center space-y-2">
        <span className="2xl:text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
        {author && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
          </span>
        )}
        {source && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <div className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={source || ''} />
      </div>
      <div className="flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2">
        <span className="2xl:text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
        {author && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
          </span>
        )}
        {source && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
          </span>
        )}
      </div>
    </div>
  );
}
