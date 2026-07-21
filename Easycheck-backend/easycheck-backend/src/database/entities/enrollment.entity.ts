import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Refleja la forma de `enrollments` en Data.repository.ts:
// { studentRut, subjectId }.
@Entity({ name: 'enrollments' })
@Index(['studentRut', 'subjectId'], { unique: true })
export class EnrollmentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 12 })
  studentRut!: string;

  @Column({ length: 20 })
  subjectId!: string;
}
