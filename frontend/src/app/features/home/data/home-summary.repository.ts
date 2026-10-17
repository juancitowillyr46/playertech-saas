import { HomeSummaryData } from '../models/home-summary.models';

/**
 * Lectura del resumen del inicio (spec 003, contracts/repositories.md): plan
 * vigente, sede principal y archivo del logo. RLS limita todo a la academia del
 * miembro.
 */
export abstract class HomeSummaryRepository {
    abstract loadSummary(logoFileId: string | null): Promise<HomeSummaryData>;
}
