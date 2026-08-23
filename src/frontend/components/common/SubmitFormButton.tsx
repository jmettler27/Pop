import React from 'react';

import { useFormikContext } from 'formik';
import { Send } from 'lucide-react';

import { Button } from '@/frontend/components/ui/button';

interface SubmitFormButtonProps {
  isSubmitting: boolean;
  label: React.ReactNode;
}

export default function SubmitFormButton({ isSubmitting, label }: SubmitFormButtonProps) {
  const formik = useFormikContext();

  return (
    <Button
      // size='large'
      className="bg-blue-500 text-white hover:bg-blue-500/80"
      disabled={isSubmitting || formik.isSubmitting}
      type="submit"
    >
      {label}
      <Send className="ml-2 size-4" />
    </Button>
  );
}
