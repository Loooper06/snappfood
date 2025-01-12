import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheckOtpDto, SendOtpDto } from './dto/otp.dto';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SwaggerConsumes } from 'src/common/enums/swagger.consumes.enum';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  sendOtp(@Body() otpDto: SendOtpDto) {
    return this.authService.sendOtp(otpDto);
  }

  @Post('check-otp')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  checkOtp(@Body() otpDto: CheckOtpDto) {
    return this.authService.checkOtp(otpDto);
  }
}
