import { BaseEntity } from 'src/common/abstracts/base.entity';
import { EntityName } from 'src/common/enums/entity-name.enum';
import { CategoryEntity } from 'src/modules/category/entities/category.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { SupplierOtpEntity } from './supplier-otp.entity';
import { SupplierStatus } from '../enums/status.enum';
import { SupplierDocumentEntity } from './supplier-document.entity';

@Entity(EntityName.Supplier)
export class SupplierEntity extends BaseEntity {
  @Column()
  manager_name: string;
  @Column()
  manager_family: string;
  @Column()
  store_name: string;
  @Column()
  phone: string;
  @Column({ default: false })
  phone_verify: boolean;
  @Column()
  city: string;
  @Column({ nullable: true })
  national_code: string;
  @Column({ nullable: true })
  email: string;
  @Column({ nullable: true, default: SupplierStatus.Registered })
  status: string;
  @Column({ nullable: true })
  invite_code: string;
  @Column({ nullable: true })
  agentId: number;
  @Column({ nullable: true })
  otpId: number;

  @OneToOne(() => SupplierOtpEntity, (otp) => otp.supplier)
  @JoinColumn()
  otp: SupplierOtpEntity;

  @ManyToOne(() => SupplierEntity, (supplier) => supplier.subsets)
  agent: SupplierEntity;
  @OneToMany(() => SupplierEntity, (subset) => subset.agent)
  subsets: SupplierEntity[];

  @Column({ nullable: true })
  categoryId: number;

  @ManyToOne(() => CategoryEntity, (category) => category.suppliers, {
    onDelete: 'SET NULL',
  })
  category: CategoryEntity;

  @OneToMany(() => SupplierDocumentEntity, (document) => document.supplier)
  documents: SupplierDocumentEntity[];
}
