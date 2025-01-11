import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
} from '@nestjs/common';

export function UploadFile(
  maxSize: number,
  message: string = 'فایل انتخاب شده نباید بیشتر از 3 مگابایت باشد',
  fileType: string = 'image/(png|jpg|jpeg|webp|jfif)',
  required: boolean = true,
) {
  return UploadedFile(
    new ParseFilePipe({
      fileIsRequired: required,
      validators: [
        new MaxFileSizeValidator({
          maxSize,
          message,
        }),
        new FileTypeValidator({
          fileType,
        }),
      ],
    }),
  );
}
