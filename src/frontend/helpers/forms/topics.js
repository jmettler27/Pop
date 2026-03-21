import { Topic } from '@/backend/models/Topic';

/* Validation */
import * as Yup from 'yup';
export const topicSchema = () =>
  Yup.string().oneOf(Object.values(Topic), 'Invalid question topic.').required('Required.');
