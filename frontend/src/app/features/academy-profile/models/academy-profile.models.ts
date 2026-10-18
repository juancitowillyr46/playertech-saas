import { StoredFile } from '../../../core/storage/models/storage.models';

/** Datos editables de la academia (DEC-21). Los opcionales vacíos son `null`. */
export interface AcademyProfileInput {
    readonly name: string;
    readonly contactEmail: string | null;
    readonly contactPhone: string | null;
    readonly address: string | null;
    readonly city: string | null;
}

/** Fila de la academia tal como la devuelve el repositorio (spec 007, data-model.md). */
export interface AcademyDetails extends AcademyProfileInput {
    readonly id: string;
    readonly logoFileId: string | null;
}

/** Lo que lee el repositorio: la academia, su plan y su logo vigente. */
export interface AcademyProfileData {
    readonly academy: AcademyDetails;
    readonly planName: string | null;
    readonly logo: StoredFile | null;
}

/** Lo que muestra la pantalla: los datos del repositorio más la URL del logo. */
export interface AcademyProfile extends AcademyProfileData {
    readonly logoUrl: string | null;
}
