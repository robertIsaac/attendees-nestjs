import { Entity, Column, ObjectIdColumn } from 'typeorm';

@Entity()
export class BookEntity {
  @ObjectIdColumn()
  id: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  createAt: Date;

  @Column({ nullable: false })
  massId: string;

  @Column()
  otherPeople: string[];
}
