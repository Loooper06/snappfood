import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Put,
  Patch,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import {
  SupplementaryInfoDto,
  SupplierSignupDto,
  UploadContractDto,
  UploadDocsDto,
} from './dto/supplier.dto';
import { CheckOtpDto } from '../auth/dto/otp.dto';
import { SupplierAuth } from 'src/common/decorators/auth.decorator';
import {
  UploadFileFieldsS3,
  UploadFileS3,
} from 'src/common/interceptors/upload-file.interceptor';
import { ApiConsumes } from '@nestjs/swagger';
import { SwaggerConsumes } from 'src/common/enums/swagger.consumes.enum';
import { UploadFile } from 'src/common/decorators/upload-file.decorator';
import { MulterFile } from 'src/common/types/file.type';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post('/signup')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  sendOtp(@Body() signupDto: SupplierSignupDto) {
    return this.supplierService.signup(signupDto);
  }

  @Post('/check-otp')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  signup(@Body() otpDto: CheckOtpDto) {
    return this.supplierService.checkOtp(otpDto);
  }

  @Post('/supplementary-information')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  @SupplierAuth()
  supplementaryInformation(@Body() infoDto: SupplementaryInfoDto) {
    return this.supplierService.saveSupplementaryInfo(infoDto);
  }

  @Put('/upload-documents')
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @SupplierAuth()
  @UseInterceptors(
    UploadFileFieldsS3([
      { name: 'acceptedDoc', maxCount: 1 },
      { name: 'image', maxCount: 1 },
      { name: '', maxCount: 1 },
    ]),
  )
  uploadDocuments(@Body() infoDto: UploadDocsDto, @UploadedFiles() files: any) {
    return this.supplierService.uploadDocument(files);
  }

  @Patch('/upload-contract')
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @SupplierAuth()
  @UseInterceptors(UploadFileS3('contract'))
  uploadContract(
    @UploadFile(3 * 1024 * 1024, 'قرارداد بارگذاری شده معتبر نمی باشد')
    contractFile: MulterFile,
    @Body()
    infoDto: UploadContractDto,
  ) {
    return this.supplierService.uploadContract(contractFile);
  }
}
