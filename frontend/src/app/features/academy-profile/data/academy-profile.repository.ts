import { AcademyDetails, AcademyProfileData, AcademyProfileInput } from '../models/academy-profile.models';

/** Acceso al perfil de la academia del contexto (spec 007, contracts/profile-contracts.md). */
export abstract class AcademyProfileRepository {
    /** Academia del contexto con su plan activo y su logo vigente. */
    abstract getProfile(): Promise<AcademyProfileData>;

    /** Guarda los datos editables; si la academia ya no es accesible, rechaza con not_found. */
    abstract updateProfile(input: AcademyProfileInput): Promise<AcademyDetails>;

    /** Asigna el logo, o lo retira con `null`. */
    abstract setLogo(fileId: string | null): Promise<void>;
}
