# Aplicacion de BDD en el CU-02: Registro de usuario institucional

## 1. Contexto del caso de uso

El caso de uso CU-02, denominado "Desplegar formulario de registro de nuevo usuario", corresponde al proceso mediante el cual un administrativo registra en EasyCheck a usuarios que ya existen en el sistema institucional de la Universidad de La Frontera. El actor principal es el administrativo, quien ingresa el RUT, completa la informacion requerida y selecciona la accion Crear Cuenta. La precondicion funcional establece que el usuario debe existir previamente en el sistema institucional UFRO. Como postcondicion, la cuenta queda creada con uno de los roles permitidos: ESTUDIANTE, PROFESOR o DIRECTOR_CARRERA.

En el backend NestJS, este caso de uso fue implementado como un servicio de aplicacion llamado `RegisterUserService`. Esta clase concentra la regla principal del CU-02: antes de crear una cuenta local en EasyCheck, el sistema debe validar la identidad institucional y verificar que el usuario no se encuentre registrado previamente. Esta separacion permite mantener una arquitectura coherente con Clean Architecture y DDD, porque el caso de uso no depende directamente de una base de datos concreta ni de un sistema institucional especifico. En su lugar, utiliza puertos: `InstitutionalIdentityPort` para consultar la identidad UFRO y `UsersRepositoryPort` para consultar y guardar usuarios EasyCheck.

## 2. Aplicacion de BDD

BDD, o Behavior Driven Development, se aplico exclusivamente al CU-02 para expresar el comportamiento esperado desde el lenguaje del negocio antes que desde detalles tecnicos internos. La especificacion se construyo con una User Story y escenarios escritos en Gherkin. Esta decision es coherente con el objetivo academico del proyecto, ya que permite evidenciar una trazabilidad directa entre requerimiento, criterio de aceptacion y prueba automatizada.

La User Story utilizada fue:

> Como administrativo  
> Quiero registrar usuarios institucionales  
> Para que puedan acceder al sistema EasyCheck.

A partir de esta historia se definieron cuatro escenarios de aceptacion. El escenario de registro exitoso representa el flujo principal del caso de uso. Los otros tres escenarios representan los flujos alternativos solicitados: usuario duplicado, usuario inexistente y credenciales institucionales invalidas. Cada escenario se encuentra en el archivo `test/features/registro-usuario.feature` y utiliza la estructura Given, When, Then. Esta estructura permite separar claramente las precondiciones, la accion del actor y el resultado observable del sistema.

## 3. Escenarios Gherkin

El archivo `registro-usuario.feature` define el comportamiento esperado del CU-02 en lenguaje cercano al usuario. Por ejemplo, el escenario exitoso declara que existe un usuario institucional con un RUT determinado, que dicho usuario no esta registrado en EasyCheck, que el administrativo lo registra usando credenciales validas y que el sistema crea la cuenta con rol ESTUDIANTE. Este escenario se corresponde con el flujo principal: ingresar RUT, validar usuario institucional, completar datos, seleccionar Crear Cuenta y registrar la cuenta.

El escenario "Usuario duplicado" verifica que el backend no cree una segunda cuenta si el RUT ya existe en EasyCheck. El escenario "Usuario inexistente" valida la precondicion del caso de uso, ya que un usuario que no pertenece al sistema institucional UFRO no puede ser registrado. Finalmente, el escenario "Credenciales invalidas" cubre el flujo alternativo en que la informacion institucional entregada no permite autenticar al usuario. En conjunto, estos escenarios constituyen criterios de aceptacion ejecutables.

## 4. Uso de Glue Code

El Glue Code fue implementado con `jest-cucumber` en el archivo `test/bdd/registro-usuario.steps.ts`. Su funcion es conectar cada frase Gherkin con codigo TypeScript ejecutable dentro del contexto de pruebas de NestJS. Para ello, se crea un `TestingModule` que importa `UsersModule` y obtiene instancias reales de `RegisterUserService`, `InMemoryInstitutionalIdentityService` e `InMemoryUsersRepository`.

La relacion entre Given, When y Then y los servicios NestJS es la siguiente:

- `Given el sistema institucional UFRO se encuentra disponible`: verifica que el doble de infraestructura `InMemoryInstitutionalIdentityService` este cargado como proveedor NestJS.
- `Given existe el usuario institucional con RUT ...`: prepara el sistema institucional mediante el metodo `seed` del servicio institucional en memoria.
- `Given el usuario ... ya/no esta registrado en EasyCheck`: consulta o prepara el repositorio `InMemoryUsersRepository`, que implementa el puerto `UsersRepositoryPort`.
- `When el administrativo registra al usuario ...`: ejecuta directamente `RegisterUserService.execute`, que representa el caso de uso CU-02.
- `Then el sistema registra la cuenta ...`: comprueba el resultado retornado por el servicio y verifica el efecto persistido en el repositorio.
- `Then el sistema informa ...`: comprueba las excepciones de dominio generadas por el caso de uso ante flujos alternativos.

De esta manera, las pruebas no se limitan a verificar metodos aislados, sino que validan el comportamiento completo del caso de uso desde una especificacion legible por personas no tecnicas. Esto corresponde a BDD porque los escenarios describen conducta observable del sistema, usan lenguaje del dominio y funcionan como documentacion viva: si una regla cambia, el escenario Gherkin y el Glue Code deben actualizarse, manteniendo alineados requerimientos, implementacion y pruebas automatizadas.

## 5. Coherencia con la implementacion backend

La implementacion backend se realizo en NestJS y TypeScript. El endpoint `POST /api/v1/users/register` recibe un DTO validado con `class-validator`, documentado con Swagger y delegado al servicio de aplicacion `RegisterUserService`. La entidad `UserTypeOrmEntity` deja definido el mapeo esperado para PostgreSQL mediante TypeORM, incluyendo identificador UUID, RUT unico, correo institucional, nombre completo, rol y fecha de creacion.

Aunque las pruebas BDD utilizan repositorios en memoria para asegurar rapidez, determinismo y aislamiento, la estructura de puertos permite reemplazar esos dobles por implementaciones TypeORM conectadas a PostgreSQL sin modificar la logica del caso de uso. Esto es consistente con Clean Architecture: el caso de uso depende de abstracciones y no de detalles de infraestructura. Ademas, la documentacion Swagger facilita revisar el contrato HTTP del backend y la validacion global configurada en `main.ts` protege la entrada de datos desde la API.

En sintesis, el CU-02 fue tratado como el unico caso de uso BDD del proyecto, y su comportamiento quedo documentado en tres niveles complementarios: User Story, escenarios Gherkin y Glue Code ejecutable con Jest. Esta estrategia permite demostrar en un informe universitario que BDD no fue usado solo como tecnica de testing, sino como mecanismo de comunicacion entre requerimientos, diseno del backend y evidencia automatizada de aceptacion.
