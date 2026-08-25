import { useContext } from 'react';

import { ActiveQuestionContext, type ActiveQuestionData } from '@/frontend/contexts/ActiveQuestionContext';

const useActiveQuestion = (): ActiveQuestionData | null => {
  return useContext(ActiveQuestionContext);
};

export default useActiveQuestion;
