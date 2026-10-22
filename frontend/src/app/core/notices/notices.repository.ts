import { NewResponsesNotice } from './notices.models';

/** Avisos del owner en la academia actual (spec 014, HU-041). Solo dentro de la aplicación (DEC-41). */
export abstract class NoticesRepository {
    /** Acudientes y dispositivos pendientes de validar, sin repetir un mismo dispositivo. */
    abstract pendingCount(): Promise<number>;

    /** Convocatorias con respuestas que el usuario aún no vio. */
    abstract newResponses(): Promise<readonly NewResponsesNotice[]>;
}
