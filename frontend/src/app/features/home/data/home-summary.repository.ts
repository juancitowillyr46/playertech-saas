import { HomeSummaryData } from '../models/home-summary.models';

/**
 * Lectura del resumen del inicio (spec 003, contracts/repositories.md): plan
 * vigente, sede principal, archivo del logo y datos de contacto de la academia. RLS limita todo a la academia del
 * miembro.
 */
export abstract class HomeSummaryRepository {
    abstract loadSummary(logoFileId: string | null): Promise<HomeSummaryData>;
}
