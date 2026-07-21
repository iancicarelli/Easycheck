import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Refleja la forma de `AssistanceRecord` en Data.repository.ts:
// { id, studentRut, classId, subjectId, date, present }.
// A diferencia de ClassSession, el id SÍ es autogenerado: el repositorio
// in-memory también genera el id en `insertAssistance`.
@Entity({ name: 'assistances' })
@Index(['studentRut', 'classId'], { unique: true })
export class AssistanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 12 })
  studentRut!: string;

  @Column()
  classId!: number;

  @Index()
  @Column({ length: 20 })
  subjectId!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column()
  present!: boolean;
}
