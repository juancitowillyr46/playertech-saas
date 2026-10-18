import { inject, Injectable, signal } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { FileStorageRepository } from '../../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../../core/storage/models/storage.models';
import { AcademyProfileRepository } from '../data/academy-profile.repository';
import { PREPARE_LOGO_IMAGE } from '../data/logo-image';
import { AcademyProfile, AcademyProfileData, AcademyProfileInput } from '../models/academy-profile.models';
import { LogoFileProblem, validateLogoFile } from '../validators/logo-file';

export type AcademyProfileStatus = 'loading' | 'ready' | 'error';

/** Texto recortado; vacío pasa a null (patrón de la spec 004). */
function clean(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed === '' ? null : trimmed;
}

function cleanInput(input: AcademyProfileInput): AcademyProfileInput {
    return { name: input.name.trim(), contactEmail: clean(input.contactEmail), contactPhone: clean(input.contactPhone), address: clean(input.address), city: clean(input.city) };
}

/**
 * Estado y operaciones del perfil de la academia (spec 007, contracts/profile-contracts.md).
 * Una operación a la vez; el nombre y el logo se reflejan en el contexto de academia para
 * que la barra superior y el inicio los muestren sin recargar.
 */
@Injectable()
export class AcademyProfileService {
    private readonly repository = inject(AcademyProfileRepository);
    private readonly storage = inject(FileStorageRepository);
    private readonly academyContext = inject(AcademyContextService);
    private readonly prepareLogoImage = inject(PREPARE_LOGO_IMAGE);

    readonly profile = signal<AcademyProfile | null>(null);
    readonly status = signal<AcademyProfileStatus>('loading');
    /** Hay una operación en curso: las demás acciones se ignoran (doble toque). */
    readonly busy = signal(false);

    /** Carga o vuelve a cargar el perfil (también como reintento tras un error). */
    async load(): Promise<void> {
        this.status.set('loading');

        try {
            this.profile.set(await this.withUrl(await this.repository.getProfile()));
            this.status.set('ready');
        } catch {
            this.status.set('error');
        }
    }

    save(input: AcademyProfileInput): Promise<void> {
        return this.run(async () => {
            const academy = await this.repository.updateProfile(cleanInput(input));

            this.profile.update((profile) => profile && { ...profile, academy });
            this.academyContext.applyAcademyChanges({ name: academy.name });
        });
    }

    /**
     * Valida, prepara, sube, asigna y purga el logo anterior (research R4). Devuelve el problema
     * del archivo si no es válido, sin subir nada.
     */
    async replaceLogo(file: File): Promise<LogoFileProblem | null> {
        const problem = await validateLogoFile(file);

        if (problem) {
            return problem;
        }

        await this.run(async () => {
            const previous = this.profile()?.logo ?? null;
            const academyId = this.profile()?.academy.id ?? '';
            const uploaded = await this.storage.upload({ file: await this.prepareLogoImage(file), bucket: 'public-assets', module: 'academy', entityId: academyId });

            try {
                await this.repository.setLogo(uploaded.id);
            } catch (error) {
                // El logo anterior sigue asignado: se retira el que no llegó a usarse.
                await this.storage.purge(uploaded).catch(() => undefined);
                throw error;
            }

            await this.purgeQuietly(previous);
            await this.applyLogo(uploaded);
        });

        return null;
    }

    removeLogo(): Promise<void> {
        return this.run(async () => {
            const previous = this.profile()?.logo ?? null;

            await this.repository.setLogo(null);
            await this.purgeQuietly(previous);
            await this.applyLogo(null);
        });
    }

    private async run(operation: () => Promise<void>): Promise<void> {
        if (this.busy() || !this.profile()) {
            return;
        }

        this.busy.set(true);

        try {
            await operation();
        } catch (error) {
            if (error instanceof AppError && error.code === 'not_found') {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    /** El logo ya cambió: si falla borrar la imagen anterior, la recogerá la limpieza del MVP+. */
    private async purgeQuietly(file: StoredFile | null): Promise<void> {
        if (file) {
            await this.storage.purge(file).catch((error: unknown) => console.warn('No se pudo borrar el logo anterior', error));
        }
    }

    private async applyLogo(logo: StoredFile | null): Promise<void> {
        const logoUrl = logo ? await this.storage.getUrl(logo) : null;

        this.profile.update((profile) => profile && { ...profile, logo, logoUrl, academy: { ...profile.academy, logoFileId: logo?.id ?? null } });
        this.academyContext.applyAcademyChanges({ logoFileId: logo?.id ?? null });
    }

    /** Relee sin pasar a carga; si falla, se conserva lo visible. */
    private async refresh(): Promise<void> {
        try {
            this.profile.set(await this.withUrl(await this.repository.getProfile()));
        } catch {
            // Lo visible sigue siendo válido; el próximo cambio lo actualizará.
        }
    }

    private async withUrl(data: AcademyProfileData): Promise<AcademyProfile> {
        return { ...data, logoUrl: data.logo ? await this.storage.getUrl(data.logo) : null };
    }
}
