import { AcademyContext } from '../models/academy-context.models';

/**
 * Resuelve la academia del usuario a partir de su membresía. No recibe
 * identificadores: el usuario se deduce de la sesión (FR-012).
 */
export abstract class AcademyContextRepository {
    abstract loadCurrent(): Promise<AcademyContext>;
}
