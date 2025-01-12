import { IsMobilePhone, IsString, Length } from 'class-validator';

export class SignUpDto {
  @IsString()
  first_name: string;
  @IsString()
  last_name: string;
  @IsMobilePhone(
    'fa-IR',
    {},
    { message: 'شماره موبایل وارد شده معتبر نمی باشد' },
  )
  @Length(11, 11, { message: 'موبایل وارد شده معتبر نمی باشد' })
  mobile: string;
}
