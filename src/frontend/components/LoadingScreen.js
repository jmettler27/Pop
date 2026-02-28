import { CircularProgress } from '@mui/material';

export default function LoadingScreen({ loadingText }) {
  return (
    <div className="flex flex-col h-full w-full justify-center items-center space-y-9">
      {loadingText && <h1 className="2xl:text-4xl">{loadingText}</h1>}
      <CircularProgress color="inherit" />
    </div>
  );
}
