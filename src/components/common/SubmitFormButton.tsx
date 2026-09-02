import React from 'react';

import { useFormikContext } from 'formik';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SubmitFormButtonProps {
  isSubmitting: boolean;
  label: React.ReactNode;
}

export default function SubmitFormButton({ isSubmitting, label }: SubmitFormButtonProps) {
  const formik = useFormikContext();

  return (
    <Button
      // size='large'
      className="bg-green-600 text-white hover:bg-green-600/80"
      disabled={isSubmitting || formik.isSubmitting}
      type="submit"
    >
      {label}
      <Send className="ml-2 size-4" />
    </Button>
  );
}
