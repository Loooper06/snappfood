import { BaseEntity } from 'src/common/abstracts/base.entity';
import { EntityName } from 'src/common/enums/entity-name.enum';
import { Column, Entity, ManyToOne } from 'typeorm';
import { SupplierEntity } from './supplier.entity';

@Entity(EntityName.SupplierDocument)
export class SupplierDocumentEntity extends BaseEntity {
  @Column({ nullable: true })
  image: string;
  @Column({ nullable: true })
  image_key: string;
  @Column({ nullable: true })
  document: string;
  @Column({ nullable: true })
  document_key: string;
  @Column({ nullable: true })
  contract: string;
  @Column({ nullable: true })
  contract_key: string;
  @Column({ nullable: true })
  supplierId: number;

  @ManyToOne(() => SupplierEntity, (supplier) => supplier.documents)
  supplier: SupplierEntity;
}
