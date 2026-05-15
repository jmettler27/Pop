/* Validation */
import * as Yup from 'yup';

import { Topic } from '@/models/Topic';

export const topicSchema = () =>
  Yup.string().oneOf(Object.values(Topic), 'Invalid question topic.').required('Required.');
