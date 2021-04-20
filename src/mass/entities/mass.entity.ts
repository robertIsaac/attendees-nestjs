import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
export class Mass {
  @ObjectIdColumn()
  id: string;

  @Column({ nullable: false })
  nameAr: string;

  @Column({ nullable: false })
  nameEn: string;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  availableFrom: Date;

  @Column({ nullable: false })
  limit: number;
}
