import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @ApiProperty()
  @IsMobilePhone('fa-IR', {}, { message: 'موبایل وارد شده صحیح نمی باشد' })
  mobile: string;
}

export class CheckOtpDto {
  @ApiProperty()
  @IsMobilePhone('fa-IR', {}, { message: 'موبایل وارد شده صحیح نمی باشد' })
  mobile: string;
  @ApiProperty()
  @IsString()
  @Length(4, 5, { message: 'کد معتبر نمی باشد' })
  code: string;
}
