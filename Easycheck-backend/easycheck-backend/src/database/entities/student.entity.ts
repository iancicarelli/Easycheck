import { Column, Entity, PrimaryColumn } from 'typeorm';

// Refleja la forma de `students` en Data.repository.ts: { rut, name }.
@Entity({ name: 'students' })
export class StudentEntity {
  @PrimaryColumn({ length: 12 })
  rut!: string;

  @Column({ length: 120 })
  name!: string;
}
