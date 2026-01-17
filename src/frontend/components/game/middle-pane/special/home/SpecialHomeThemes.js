import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, collection } from 'firebase/firestore';
import { useDocumentData, useCollectionOnce } from 'react-firebase-hooks/firestore';

import { useTeamContext } from '@/frontend/contexts';

import SpecialHomeThemeAvatar from '@/frontend/components/game/middle-pane/special/home/SpecialHomeThemeAvatar';
import LoadingScreen from '@/frontend/components/LoadingScreen';

import { useParams } from 'next/navigation';

import { Grid, Box } from '@mui/material';

export default function SpecialHomeThemes({ round }) {
  const { id: gameId } = useParams();
  const myTeam = useTeamContext();

  const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
  const gameThemesCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes');

  const [chooser, chooserLoading, chooserError] = useDocumentData(chooserRef);
  const [gameThemeDocs, gameThemesLoading, gameThemesError] = useCollectionOnce(gameThemesCollectionRef);

  if (chooserError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(chooserError)}</strong>
      </p>
    );
  }
  if (gameThemesError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameThemesError)}</strong>
      </p>
    );
  }
  if (chooserLoading) {
    return <LoadingScreen loadingText="Loading game states..." />;
  }
  if (gameThemesLoading) {
    return <LoadingScreen loadingText="Loading game themes..." />;
  }
  if (!chooser || !gameThemeDocs) {
    return <></>;
  }

  const gameThemes = gameThemeDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const { chooserOrder, chooserIdx } = chooser;
  const chooserTeamId = chooserOrder[chooserIdx];
  const isChooser = chooserTeamId === myTeam;

  const getThemeAvatar = (idx) => <SpecialHomeThemeAvatar gameTheme={gameThemes[idx]} isChooser={isChooser} />;

  const renderThemeGrid = (gridLayout) => (
    <Grid container justifyContent="center">
      {gridLayout.map((gridItem) => (
        <Grid
          item
          key={gridItem.themeIndex}
          container
          xs={gridItem.xs}
          alignItems={gridItem.alignItems}
          direction="column"
        >
          {getThemeAvatar(gridItem.themeIndex)}
        </Grid>
      ))}
    </Grid>
  );

  switch (gameThemes.length) {
    case 4:
      return (
        <Box className="flex flex-col w-[50%] h-full overflow-auto justify-center space-y-9 p-0.5">
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(0)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 1 },
            { xs: 6, alignItems: 'center', themeIndex: 2 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(3)}</Grid>
          </Grid>
        </Box>
      );
    case 5:
      return (
        <Box className="flex flex-col w-[50%] h-full overflow-auto justify-center space-y-9 p-0.5">
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(0)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 4, alignItems: 'flex-end', themeIndex: 1 },
            { xs: 4, alignItems: 'center', themeIndex: 2 },
            { xs: 4, alignItems: 'flex-start', themeIndex: 3 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(4)}</Grid>
          </Grid>
        </Box>
      );
    case 6:
      return (
        <Box className="flex flex-col w-[50%] h-full overflow-auto justify-around p-0.5">
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(0)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 1 },
            { xs: 6, alignItems: 'center', themeIndex: 2 },
          ])}

          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 3 },
            { xs: 6, alignItems: 'center', themeIndex: 4 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(5)}</Grid>
          </Grid>
        </Box>
      );
    case 7:
      return (
        <Box className="flex flex-col w-[50%] h-full overflow-auto justify-around p-0.5">
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(0)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 1 },
            { xs: 6, alignItems: 'center', themeIndex: 2 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(6)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 3 },
            { xs: 6, alignItems: 'center', themeIndex: 4 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(5)}</Grid>
          </Grid>
        </Box>
      );
    case 8:
      return (
        <Box className="flex flex-col w-[50%] h-full overflow-auto justify-around p-0.5">
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(0)}</Grid>
          </Grid>
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 1 },
            { xs: 6, alignItems: 'center', themeIndex: 2 },
          ])}
          {renderThemeGrid([
            { xs: 6, alignItems: 'flex-start', themeIndex: 3 },
            { xs: 6, alignItems: 'flex-end', themeIndex: 4 },
          ])}
          {renderThemeGrid([
            { xs: 6, alignItems: 'center', themeIndex: 5 },
            { xs: 6, alignItems: 'center', themeIndex: 6 },
          ])}
          <Grid container justifyContent="center">
            <Grid item>{getThemeAvatar(7)}</Grid>
          </Grid>
        </Box>
      );
    default:
      return null;
  }
}
