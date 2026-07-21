import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Refleja la forma de `teachings` en Data.repository.ts:
// { professorRut, subjectId }.
@Entity({ name: 'teachings' })
@Index(['professorRut', 'subjectId'], { unique: true })
export class TeachingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 12 })
  professorRut!: string;

  @Column({ length: 20 })
  subjectId!: string;
}
