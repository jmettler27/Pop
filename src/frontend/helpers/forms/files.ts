import React from 'react';

import * as Yup from 'yup';

export const MAX_IMAGE_SIZE_MB = 5;
export const IMAGE_VALID_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'];

export const MAX_AUDIO_SIZE_MB = 10;
export const AUDIO_VALID_TYPES = ['mp3', 'mpeg'];

export function getFileFromRef(fileRef: React.RefObject<HTMLInputElement | null>): File | null {
  return fileRef?.current?.files ? fileRef.current.files[0] : null;
}

const fileIsNotTooBig = (file: File, maxSizeMB: number): boolean => {
  return file.size / 1024 / 1024 <= maxSizeMB;
};

const fileIsOfCorrectType = (file: File, validTypes: string[]): boolean => {
  const type = file.type.split('/')[1];
  return validTypes.includes(type);
};

export const REQUIRED_FILE_TEST_NAME = 'is-file-present';

export const imageFileSchema = (imageFileRef: React.RefObject<HTMLInputElement | null>, required: boolean) =>
  Yup.mixed()
    .test(REQUIRED_FILE_TEST_NAME, 'No file selected', () => {
      const image = getFileFromRef(imageFileRef);
      return required ? !!image : true;
    })
    .test('is-file-too-big', `File exceeds ${MAX_IMAGE_SIZE_MB}MB`, () => {
      const image = getFileFromRef(imageFileRef);
      if (!image) return !required;
      return fileIsNotTooBig(image, MAX_IMAGE_SIZE_MB);
    })
    .test('is-file-of-correct-type', `File is not of supported type (${IMAGE_VALID_TYPES})`, () => {
      const image = getFileFromRef(imageFileRef);
      if (!image) return !required;
      return fileIsOfCorrectType(image, IMAGE_VALID_TYPES);
    });

export const audioFileSchema = (audioFileRef: React.RefObject<HTMLInputElement | null>, required: boolean) =>
  Yup.mixed()
    .test(REQUIRED_FILE_TEST_NAME, 'No file selected', () => {
      const audio = getFileFromRef(audioFileRef);
      return required ? !!audio : true;
    })
    .test('is-file-too-big', `Audio file exceeds ${MAX_AUDIO_SIZE_MB}MB`, () => {
      const audio = getFileFromRef(audioFileRef);
      if (!audio) return !required;
      return fileIsNotTooBig(audio, MAX_AUDIO_SIZE_MB);
    })
    .test('is-file-of-correct-type', `File is not of supported type (${AUDIO_VALID_TYPES})`, () => {
      const audio = getFileFromRef(audioFileRef);
      if (!audio) return !required;
      return fileIsOfCorrectType(audio, AUDIO_VALID_TYPES);
    });
