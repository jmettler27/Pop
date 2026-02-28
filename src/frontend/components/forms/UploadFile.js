import { Formik, Form, useField, useFormikContext } from 'formik';
import { useRef } from 'react';
import * as Yup from 'yup';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';

import {
  AUDIO_VALID_TYPES,
  IMAGE_VALID_TYPES,
  MAX_AUDIO_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
} from '@/frontend/utils/forms/files';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// https://mui.com/material-ui/react-button/#file-upload
const UploadFile = ({ fileRef, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <>
      <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
        Upload
        {/* <input ref={fileRef} multiple={false} type="file" {...field} value={field.value || ''} /> */}
        <VisuallyHiddenInput type="file" ref={fileRef} {...field} value={field.value || ''} />
      </Button>
      {meta.touched && meta.error && <div className="text-red-600">❌ {meta.error}</div>}
    </>
  );
};

import CancelIcon from '@mui/icons-material/Cancel';

import Image from 'next/image';

import { requiredFileFieldIndicator } from '@/frontend/utils/forms/forms';

export function UploadImage({ validationSchema, fileRef, lang, name }) {
  const formik = useFormikContext();
  const [, meta] = useField(name);

  const imageFiles = fileRef?.current?.files;
  const image = imageFiles ? imageFiles[0] : null;

  return (
    <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '400px' }}>
      <span className="text-lg">
        {requiredFileFieldIndicator(validationSchema, name)}
        {SELECT_IMAGE_FILE[lang]}
      </span>
      <br />
      <span className="text-md">
        {ACCEPTED_FORMATS[lang]}: {IMAGE_VALID_TYPES.join(', ')} (max {MAX_IMAGE_SIZE_MB}MB)
      </span>
      <br />
      {image && (
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
            color="error"
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => {
              formik.setFieldValue(name, '');
            }}
          >
            {CANCEL[lang]}
          </Button>
        </>
      )}
      <UploadFile name={name} fileRef={fileRef} />
    </Box>
  );
}

export function UploadAudio({ validationSchema, fileRef, lang, name = 'files' }) {
  const formik = useFormikContext();
  const [, meta] = useField(name);

  const audioFiles = fileRef?.current?.files;
  const audio = audioFiles ? audioFiles[0] : null;

  return (
    <Box component="section" sx={{ my: 2, p: 2, border: '2px dashed grey', width: '400px' }}>
      <span className="text-lg">
        {requiredFileFieldIndicator(validationSchema, name)}
        {SELECT_AUDIO_FILE[lang]}{' '}
      </span>
      <br />
      <span className="text-md">
        {ACCEPTED_FORMATS[lang]}: {AUDIO_VALID_TYPES.join(', ')} (max {MAX_AUDIO_SIZE_MB}MB)
      </span>
      <br />
      {audio && (
        <>
          <p>
            <span className="italic">{audio.name}</span> {!meta.error && '✅'}
          </p>
          <audio src={URL.createObjectURL(audio)} controls />
          <Button
            color="error"
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => {
              formik.setFieldValue(name, '');
            }}
          >
            {CANCEL[lang]}
          </Button>
        </>
      )}
      <UploadFile name={name} fileRef={fileRef} />
    </Box>
  );
}

const SELECT_IMAGE_FILE = {
  en: 'Select an image file',
  'fr-FR': 'Sélectionnez une image',
};

const SELECT_AUDIO_FILE = {
  en: 'Select an audio file',
  'fr-FR': 'Sélectionnez un fichier audio',
};

const ACCEPTED_FORMATS = {
  en: 'Accepted formats',
  'fr-FR': 'Formats acceptés',
};

const CANCEL = {
  en: 'Cancel',
  'fr-FR': 'Annuler',
};
