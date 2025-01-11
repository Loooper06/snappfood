import { BaseEntity } from 'src/common/abstracts/base.entity';
import { EntityName } from 'src/common/enums/entity-name.enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserAddressEntity } from './address.entity';

@Entity(EntityName.User)
export class UserEntity extends BaseEntity {
  @Column({ nullable: true })
  first_name: string;
  @Column({ nullable: true })
  last_name: string;
  @Column({ unique: true })
  mobile: string;
  @Column({ nullable: true, unique: true })
  email: string;
  @Column({ unique: true })
  invite_code: string;
  @Column({ default: 0 })
  score: number;
  @Column({ nullable: true })
  agentId: number;

  @OneToMany(() => UserAddressEntity, (address) => address.user)
  addressList: UserAddressEntity[];
}
