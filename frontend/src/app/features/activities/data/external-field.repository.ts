import { ExternalField, ExternalFieldInput } from '../models/activity.models';

/** Catálogo de canchas externas de la academia actual (spec 011, HU-037; DEC-32). */
export abstract class ExternalFieldRepository {
    /** No retiradas, por nombre. */
    abstract list(): Promise<readonly ExternalField[]>;

    /** Devuelve la cancha creada, para dejarla elegida en la actividad (CA-001 de HU-037). */
    abstract create(input: ExternalFieldInput): Promise<ExternalField>;

    abstract update(id: string, input: ExternalFieldInput): Promise<void>;

    /** Borrado lógico: las actividades que ya la usan conservan su lugar. */
    abstract retire(id: string): Promise<void>;
}
