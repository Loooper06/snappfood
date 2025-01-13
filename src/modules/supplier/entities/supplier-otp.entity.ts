import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SupplierEntity } from './supplier.entity';
import { EntityName } from 'src/common/enums/entity-name.enum';

@Entity(EntityName.SupplierOtp)
export class SupplierOtpEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column()
  code: string;
  @Column()
  expire_date: Date;
  @Column()
  supplierId: number;
  @OneToOne(() => SupplierEntity, (supplier) => supplier.otp, {
    onDelete: 'CASCADE',
  })
  supplier: SupplierEntity;
}
