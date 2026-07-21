import { Column, Entity, PrimaryColumn } from 'typeorm';

// Los profesores solo aparecen como `professorRut` en teachings; esta tabla
// les da identidad propia para el seed y futuras relaciones.
@Entity({ name: 'professors' })
export class ProfessorEntity {
  @PrimaryColumn({ length: 12 })
  rut!: string;

  @Column({ length: 120 })
  name!: string;
}
