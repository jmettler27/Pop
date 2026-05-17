'use client';

import React from 'react';
import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import { updateOrganizerName } from '@/backend/services/edit-game/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/card';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.gameEditor.ParticipantsPage', {
  participants: 'Participants',
  organizers: 'Organizers',
  players: 'Players',
  spectators: 'Spectators',
  invite: 'Invite',
  editName: 'Edit name',
  you: 'you',
  noOrganizers: 'No organizers yet.',
  noPlayers: 'No players yet.',
  noSpectators: 'No spectators yet.',
});

export default function ParticipantsPage({ params }) {
  const { data: session } = useSession();
  const intl = useIntl();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const userId = session.user.id;

  const organizerRepo = new OrganizerRepository(gameId);
  const playerRepo = new PlayerRepository(gameId);

  const { organizers, loading: orgLoading, error: orgError } = organizerRepo.useAllOrganizersOnce();
  const { players, loading: playerLoading, error: playerError } = playerRepo.useAllPlayersOnce();

  if (orgError || playerError) return <ErrorScreen />;
  if (orgLoading || playerLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 overflow-auto">
      <h1 className="text-2xl font-bold text-slate-100">{intl.formatMessage(messages.participants)}</h1>

      {/* Organizers */}
      <ParticipantSection
        title={intl.formatMessage(messages.organizers)}
        icon="👑"
        emptyMessage={intl.formatMessage(messages.noOrganizers)}
        inviteLabel={intl.formatMessage(messages.invite)}
      >
        {organizers.map((org) => (
          <ParticipantCard
            key={org.id}
            participant={org}
            isMe={org.id === userId}
            meLabel={intl.formatMessage(messages.you)}
            editLabel={intl.formatMessage(messages.editName)}
            gameId={gameId}
            onSaveName={(newName) => updateOrganizerName(gameId, org.id, newName)}
          />
        ))}
      </ParticipantSection>

      {/* Players */}
      <ParticipantSection
        title={intl.formatMessage(messages.players)}
        icon="🎮"
        emptyMessage={intl.formatMessage(messages.noPlayers)}
        inviteLabel={intl.formatMessage(messages.invite)}
      >
        {players.map((player) => (
          <ParticipantCard key={player.id} participant={player} isMe={false} />
        ))}
      </ParticipantSection>

      {/* Spectators */}
      <ParticipantSection
        title={intl.formatMessage(messages.spectators)}
        icon="👁️"
        emptyMessage={intl.formatMessage(messages.noSpectators)}
        inviteLabel={intl.formatMessage(messages.invite)}
      >
        {/* Spectators are not tracked until the game is live */}
      </ParticipantSection>
    </div>
  );
}

function ParticipantSection({ title, icon, children, emptyMessage, inviteLabel }) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <CardTitle className="text-base">{title}</CardTitle>
          <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 transition-colors">
            <PlusIcon className="h-3.5 w-3.5" />
            {inviteLabel}
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {hasChildren ? (
            children
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-4">{emptyMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ParticipantCard({ participant, isMe, meLabel, editLabel, onSaveName }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(participant.name);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      setName(participant.name);
      setIsEditing(false);
      return;
    }
    if (trimmed === participant.name) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSaveName(trimmed);
    } catch {
      setName(participant.name);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setName(participant.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-6 py-3">
      {/* Avatar */}
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-700 text-slate-300 text-sm font-medium shrink-0">
        {participant.image ? (
          <img src={participant.image} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          participant.name?.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          maxLength={50}
          className="flex-1 bg-transparent border-b-2 border-blue-500 outline-none text-slate-100 text-sm px-1 py-0.5"
        />
      ) : (
        <span className="flex-1 text-sm text-slate-200">{participant.name}</span>
      )}

      {/* Badges / actions */}
      {isMe && !isEditing && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{meLabel}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
            title={editLabel}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function PencilIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
