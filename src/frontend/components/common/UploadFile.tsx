import type { RefObject } from 'react';
import Image from 'next/image';

import { useField, useFormikContext } from 'formik';
import { Upload, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';
import type { ObjectSchema } from 'yup';

import { Button } from '@/frontend/components/ui/button';
import {
  AUDIO_VALID_TYPES,
  IMAGE_VALID_TYPES,
  MAX_AUDIO_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
} from '@/frontend/helpers/forms/files';
import { requiredFileFieldIndicator, type YupObjectSchema } from '@/frontend/helpers/forms/forms';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.forms.UploadFile', {
  selectImage: 'Select an image file',
  selectAudio: 'Select an audio file',
  acceptedFormats: 'Accepted formats',
});

interface UploadFileProps {
  fileRef?: RefObject<HTMLInputElement | null>;
  name: string;
  id?: string;
  onFileChange?: (file: File | null) => void;
  [key: string]: unknown;
}

// https://mui.com/material-ui/react-button/#file-upload
const UploadFile = ({ fileRef, onFileChange, ...props }: UploadFileProps) => {
  const [field, meta] = useField(props as { name: string });

  return (
    <>
      <Button nativeButton={false} render={<label />}>
        <Upload className="mr-2 size-4" />
        Upload
        <input
          type="file"
          className="sr-only"
          ref={fileRef}
          {...field}
          value={(field.value as string) || ''}
          onChange={(e) => {
            field.onChange(e);
            onFileChange?.(e.target.files?.[0] ?? null);
          }}
        />
      </Button>
      {meta.touched && meta.error && <div className="text-red-600">❌ {meta.error}</div>}
    </>
  );
};

interface UploadImageProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  fileRef: RefObject<HTMLInputElement | null>;
  name: string;
  existingUrl?: string | null;
  image: File | null;
  onFileChange: (file: File | null) => void;
}

export function UploadImage({
  validationSchema,
  fileRef,
  name,
  existingUrl = null,
  image,
  onFileChange,
}: UploadImageProps) {
  const intl = useIntl();
  const formik = useFormikContext();
  const [, meta] = useField(name);

  return (
    <section className="my-4 p-4 border-2 border-dashed border-gray-500 w-[400px]">
      <span className="text-lg">
        {validationSchema ? requiredFileFieldIndicator(validationSchema as YupObjectSchema, name, intl) : ''}
        {intl.formatMessage(messages.selectImage)}
      </span>
      <br />
      <span className="text-md">
        {intl.formatMessage(messages.acceptedFormats)}: {IMAGE_VALID_TYPES.join(', ')} (max {MAX_IMAGE_SIZE_MB}MB)
      </span>
      <br />
      {image ? (
        <>
          <Image
            src={URL.createObjectURL(image)}
            alt=""
            width={0}
            height={0}
            style={{ width: 'auto', maxWidth: '250px', height: 'auto', maxHeight: '250px' }}
          />
          <p>
            <span className="italic">{image.name}</span> {!meta.error && '✅'}
          </p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              formik.setFieldValue(name, '');
              onFileChange(null);
            }}
          >
            <XCircle className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </>
      ) : (
        existingUrl && (
          <Image
            src={existingUrl}
            alt=""
            width={0}
            height={0}
            style={{ width: 'auto', maxWidth: '250px', height: 'auto', maxHeight: '250px' }}
          />
        )
      )}
      <UploadFile name={name} fileRef={fileRef} onFileChange={onFileChange} />
    </section>
  );
}

interface UploadAudioProps {
  validationSchema?: ObjectSchema<Record<string, unknown>>;
  fileRef: RefObject<HTMLInputElement | null>;
  name?: string;
  existingUrl?: string | null;
  audio: File | null;
  onFileChange: (file: File | null) => void;
}

export function UploadAudio({
  validationSchema,
  fileRef,
  name = 'files',
  existingUrl = null,
  audio,
  onFileChange,
}: UploadAudioProps) {
  const intl = useIntl();
  const formik = useFormikContext();
  const [, meta] = useField(name);

  return (
    <section className="my-4 p-4 border-2 border-dashed border-gray-500 w-[400px]">
      <span className="text-lg">
        {validationSchema ? requiredFileFieldIndicator(validationSchema as YupObjectSchema, name, intl) : ''}
        {intl.formatMessage(messages.selectAudio)}{' '}
      </span>
      <br />
      <span className="text-md">
        {intl.formatMessage(messages.acceptedFormats)}: {AUDIO_VALID_TYPES.join(', ')} (max {MAX_AUDIO_SIZE_MB}MB)
      </span>
      <br />
      {audio ? (
        <>
          <p>
            <span className="italic">{audio.name}</span> {!meta.error && '✅'}
          </p>
          <audio src={URL.createObjectURL(audio)} controls />
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              formik.setFieldValue(name, '');
              onFileChange(null);
            }}
          >
            <XCircle className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </>
      ) : (
        existingUrl && <audio src={existingUrl} controls />
      )}
      <UploadFile name={name} fileRef={fileRef} onFileChange={onFileChange} />
    </section>
  );
}
