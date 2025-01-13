import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { SupplementaryInfoDto, SupplierSignupDto } from './dto/supplier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { Repository } from 'typeorm';
import {
  AuthMessage,
  ConflictMessage,
  NotFoundMessage,
  PublicMessage,
  ValidationMessage,
} from 'src/common/enums/message.enum';
import { CategoryService } from '../category/category.service';
import { SupplierOtpEntity } from './entities/supplier-otp.entity';
import { randomInt } from 'crypto';
import { CheckOtpDto } from '../auth/dto/otp.dto';
import { TokensPayload } from '../auth/types/payload';
import { JwtService } from '@nestjs/jwt';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { SupplierStatus } from './enums/status.enum';
import { DocumentType } from './types/type';
import { S3Service } from '../s3/s3.service';
import { SupplierDocumentEntity } from './entities/supplier-document.entity';
import { S3ResultType } from 'src/common/types/s3-types';
import { MulterFile } from 'src/common/types/file.type';
import { FilesFolderName } from './enums/folders.enum';

@Injectable({ scope: Scope.REQUEST })
export class SupplierService {
  constructor(
    @InjectRepository(SupplierEntity)
    private supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(SupplierOtpEntity)
    private supplierOtpRepository: Repository<SupplierOtpEntity>,
    @InjectRepository(SupplierDocumentEntity)
    private supplierDocumentRepository: Repository<SupplierDocumentEntity>,
    private categoryService: CategoryService,
    private jwtService: JwtService,
    private s3Service: S3Service,
    @Inject(REQUEST) private request: Request,
  ) {}

  async signup(signupDto: SupplierSignupDto) {
    const {
      manager_name,
      manager_family,
      phone,
      city,
      store_name,
      invite_code,
      categoryId,
    } = signupDto;
    const supplier = await this.supplierRepository.findOneBy({ phone });
    if (supplier) throw new ConflictException(ConflictMessage.Supplier);

    const category = await this.categoryService.findOneById(categoryId);
    let agent: SupplierEntity = null;
    if (invite_code)
      agent = await this.supplierRepository.findOneBy({ invite_code });

    const mobileNumber = parseInt(phone);
    let newSupplier = this.supplierRepository.create({
      manager_name,
      manager_family,
      phone,
      city,
      store_name,
      invite_code: mobileNumber.toString(32).toUpperCase(),
      categoryId: category?.id || null,
      agentId: agent?.id || null,
    });
    newSupplier = await this.supplierRepository.save(newSupplier);
    const code = await this.createOtpForSupplier(newSupplier);

    return {
      message: AuthMessage.SendOtp,
      code,
    };
  }
  async saveSupplementaryInfo(infoDto: SupplementaryInfoDto) {
    const { id } = this.request.user;
    const { email, national_code } = infoDto;

    let supplier = await this.supplierRepository.findOneBy({ national_code });
    if (supplier && supplier.id !== id)
      throw new ConflictException(ConflictMessage.SupplierNational_Code);

    supplier = await this.supplierRepository.findOneBy({ email });
    if (supplier && supplier.id !== id)
      throw new ConflictException(ConflictMessage.SupplierEmail);

    await this.supplierRepository.update(
      { id },
      { national_code, email, status: SupplierStatus.SupplementaryInfo },
    );

    return {
      message: PublicMessage.Updated,
    };
  }
  async uploadDocument(files: DocumentType) {
    const { id } = this.request.user;
    const { image, acceptedDoc } = files;

    let imageResult: S3ResultType, acceptedResult: S3ResultType;

    try {
      const supplier = await this.supplierRepository.findOneBy({ id });
      imageResult = await this.s3Service.uploadFile(
        image[0],
        FilesFolderName.SupplierDocuments,
      );
      acceptedResult = await this.s3Service.uploadFile(
        acceptedDoc[0],
        FilesFolderName.SupplierDocuments,
      );
      if (imageResult?.Location && acceptedResult?.Location) {
        await this.supplierDocumentRepository.insert({
          supplierId: supplier.id,
          image: imageResult.Location,
          image_key: imageResult.Key,
          document: acceptedResult.Location,
          document_key: acceptedResult.Key,
        });
        await this.supplierRepository.update(
          { id: supplier.id },
          { status: SupplierStatus.UploadedDocuments },
        );
      }
    } catch (err) {
      if (imageResult?.Key && imageResult?.Location) {
        await this.s3Service.deleteFile(imageResult?.Key);
      }
      if (acceptedResult?.Key && acceptedResult?.Location) {
        await this.s3Service.deleteFile(acceptedResult?.Key);
      }
      throw err;
    }

    return {
      message: PublicMessage.Uploaded,
    };
  }
  async uploadContract(contractFile: MulterFile) {
    const { id } = this.request.user;
    const supplier = await this.supplierRepository.findOneBy({ id });
    if (!supplier) throw new NotFoundException(NotFoundMessage.Any);

    const { Location, Key } = await this.s3Service.uploadFile(
      contractFile,
      FilesFolderName.SupplierDocuments,
    );

    try {
      await this.supplierDocumentRepository.update(
        { supplierId: supplier.id },
        { contract: Location, contract_key: Key },
      );
      await this.supplierRepository.update(
        { id: supplier.id },
        { status: SupplierStatus.Contract },
      );
    } catch (err) {
      if (Key && Location) {
        await this.s3Service.deleteFile(Key);
      }
      throw err;
    }

    return {
      message: PublicMessage.Uploaded,
    };
  }
  async createOtpForSupplier(supplier: SupplierEntity) {
    const code = randomInt(10000, 99999).toString();
    const expires_in = new Date(new Date().getTime() + 1000 * 60 * 5);
    let otp = await this.supplierOtpRepository.findOneBy({
      supplierId: supplier.id,
    });

    if (otp) {
      if (otp.expire_date > new Date())
        throw new BadRequestException(AuthMessage.CodeNotExpired);
      otp.code = code;
      otp.expire_date = expires_in;
    } else {
      otp = this.supplierOtpRepository.create({
        code,
        expire_date: expires_in,
        supplierId: supplier.id,
      });
    }

    await this.supplierOtpRepository.save(otp);
    supplier.otpId = otp.id;
    await this.supplierRepository.save(supplier);

    return code;
  }
  async checkOtp(otpDto: CheckOtpDto) {
    const { mobile, code } = otpDto;
    const supplier = await this.supplierRepository.findOne({
      where: { phone: mobile },
      relations: {
        otp: true,
      },
    });

    const now = new Date();
    const otp = supplier?.otp;

    if (!supplier || !supplier?.otp)
      throw new UnauthorizedException(AuthMessage.NotFoundAccount);
    if (otp?.code !== code)
      throw new UnauthorizedException(ValidationMessage.Invalid_Code);
    if (otp?.expire_date < now)
      throw new UnauthorizedException(AuthMessage.CodeExpired);

    if (!supplier.phone_verify)
      await this.supplierRepository.update(
        { id: supplier.id },
        { phone_verify: true },
      );

    const { accessToken, refreshToken } = this.createAuthToken({
      id: supplier.id,
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
        const supplier = await this.supplierRepository.findOneBy({
          id: payload.id,
        });
        if (!supplier)
          throw new UnauthorizedException(AuthMessage.RequiredLogin);

        return supplier;
      }
      throw new UnauthorizedException(AuthMessage.RequiredLogin);
    } catch (error) {
      throw new UnauthorizedException(AuthMessage.RequiredLogin);
    }
  }
}
