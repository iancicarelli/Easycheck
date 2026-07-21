/**
 * Flag único que decide el modo de persistencia en TODO el backend:
 *
 * - `DB_HOST` definido (Docker Compose)  -> Postgres vía TypeORM.
 * - `DB_HOST` ausente (local y TODOS los tests) -> repositorios in-memory,
 *   exactamente el comportamiento previo. Así las suites BDD/TDD/Integration/E2E
 *   no dependen de Docker/Postgres y sus fixtures `seed*()`/`reset()` (síncronos)
 *   siguen funcionando sin cambios.
 *
 * Se evalúa al importar los módulos (los decoradores @Module se construyen una
 * sola vez), por lo que la variable debe estar definida ANTES de arrancar Node.
 */
export const USE_DATABASE = Boolean(process.env.DB_HOST);
