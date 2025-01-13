import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIdentityCard,
  IsMobilePhone,
  IsNumberString,
  IsString,
  Length,
} from 'class-validator';

export class SupplierSignupDto {
  @ApiProperty()
  @Length(3, 50)
  @IsString()
  manager_name: string;
  @ApiProperty()
  @Length(3, 100)
  @IsString()
  manager_family: string;
  @ApiProperty()
  @Length(2)
  @IsString()
  store_name: string;
  @ApiProperty()
  @IsMobilePhone('fa-IR', {}, { message: 'موبایل وارد شده صحیح نمی باشد' })
  phone: string;
  @ApiProperty()
  @Length(2)
  @IsString()
  city: string;
  @ApiPropertyOptional()
  @IsString()
  invite_code: string;
  @ApiProperty()
  @IsNumberString()
  categoryId: number;
}

export class SupplementaryInfoDto {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @IsIdentityCard('IR')
  @IsString()
  @Length(10, 10)
  national_code: string;
}

export class UploadDocsDto {
  @ApiProperty({ format: 'binary' })
  acceptedDoc: string;
  @ApiProperty({ format: 'binary' })
  image: string;
}

export class UploadContractDto {
  @ApiProperty({ format: 'binary' })
  contract: string;
}
