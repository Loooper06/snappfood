import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpEntity } from '../user/entities/user-otp.entity';
import { CheckOtpDto, SendOtpDto } from './dto/otp.dto';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { TokensPayload } from './types/payload';
import { AuthMessage, ValidationMessage } from 'src/common/enums/message.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,
    private jwtService: JwtService,
  ) {}

  async sendOtp(otpDto: SendOtpDto) {
    const { mobile } = otpDto;
    let user = await this.userRepository.findOneBy({ mobile });
    if (!user) {
      user = this.userRepository.create({ mobile });
      user = await this.userRepository.save(user);
    }
    const code: string = await this.createOtpForUser(user);
    return {
      message: AuthMessage.SendOtp,
      code,
    };
  }
  async createOtpForUser(user: UserEntity) {
    const code = randomInt(10000, 99999).toString();
    const expires_in = new Date(new Date().getTime() + 1000 * 60 * 5);
    let otp = await this.otpRepository.findOneBy({ userId: user.id });

    if (otp) {
      if (otp.expire_date > new Date())
        throw new BadRequestException(AuthMessage.CodeNotExpired);
      otp.code = code;
      otp.expire_date = expires_in;
    } else {
      otp = this.otpRepository.create({
        code,
        expire_date: expires_in,
        userId: user.id,
      });
    }

    await this.otpRepository.save(otp);
    user.otpId = otp.id;
    await this.userRepository.save(user);

    return code;
  }
  async checkOtp(otpDto: CheckOtpDto) {
    const { mobile, code } = otpDto;
    const user = await this.userRepository.findOne({
      where: { mobile },
      relations: {
        otp: true,
      },
    });

    const now = new Date();
    const otp = user?.otp;

    if (!user || !user?.otp)
      throw new UnauthorizedException(AuthMessage.NotFoundAccount);
    if (otp?.code !== code)
      throw new UnauthorizedException(ValidationMessage.Invalid_Code);
    if (otp?.expire_date < now)
      throw new UnauthorizedException(AuthMessage.CodeExpired);

    if (!user.mobile_verify)
      await this.userRepository.update(
        { id: user.id },
        { mobile_verify: true },
      );

    const { accessToken, refreshToken } = this.createAuthToken({
      id: user.id,
      mobile,
    });

    return {
      message: AuthMessage.LoggedIn,
      accessToken,
      refreshToken,
    };
  }
  createAuthToken(payload: TokensPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '3d',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '1w',
    });
    return { accessToken, refreshToken };
  }
  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify<TokensPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      if (typeof payload === 'object' && payload?.id) {
        const user = await this.userRepository.findOneBy({ id: payload.id });
        if (!user) throw new UnauthorizedException(AuthMessage.RequiredLogin);

        return user;
      }
      throw new UnauthorizedException(AuthMessage.RequiredLogin);
    } catch (error) {
      throw new UnauthorizedException(AuthMessage.RequiredLogin);
    }
  }
}
