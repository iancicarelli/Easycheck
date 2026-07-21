export class InvalidInstitutionalCredentialsError extends Error {
  constructor() {
    super('Las credenciales institucionales son invalidas');
    this.name = 'InvalidInstitutionalCredentialsError';
  }
}

export class InstitutionalUserNotFoundError extends Error {
  constructor(public readonly rut: string) {
    super(
      `El usuario con RUT ${rut} no pertenece a la Universidad de La Frontera`,
    );
    this.name = 'InstitutionalUserNotFoundError';
  }
}

export class UserAlreadyRegisteredError extends Error {
  constructor(public readonly rut: string) {
    super(`El usuario con RUT ${rut} ya se encuentra registrado`);
    this.name = 'UserAlreadyRegisteredError';
  }
}

export class RoleNotAllowedError extends Error {
  constructor(public readonly role: string) {
    super(`El rol ${role} no es permitido para registro`);
    this.name = 'RoleNotAllowedError';
  }
}

export class InvalidRutFormatError extends Error {
  constructor(public readonly rut: string) {
    super(`El formato del RUT ${rut} es invalido`);
    this.name = 'InvalidRutFormatError';
  }
}

export class RutRequiredError extends Error {
  constructor() {
    super('El RUT no puede estar vacio');
    this.name = 'RutRequiredError';
  }
}
