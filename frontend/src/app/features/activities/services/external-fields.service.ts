import { inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { ExternalFieldRepository } from '../data/external-field.repository';
import { ExternalField, ExternalFieldInput } from '../models/activity.models';

export type FieldsStatus = 'loading' | 'ready' | 'empty' | 'error';

function clean(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed === '' ? null : trimmed;
}

export function cleanFieldInput(input: ExternalFieldInput): ExternalFieldInput {
    return { name: input.name.trim(), address: clean(input.address), city: clean(input.city), directions: clean(input.directions) };
}

/** Nombre comparable: sin mayúsculas ni espacios sobrantes (índice único de la base de datos). */
function nameKey(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CO');
}

/** Catálogo de canchas externas (spec 011, HU-037). */
@Injectable()
export class ExternalFieldsService {
    private readonly repository = inject(ExternalFieldRepository);

    readonly fields = signal<readonly ExternalField[]>([]);
    readonly status = signal<FieldsStatus>('loading');
    readonly busy = signal(false);

    async load(): Promise<void> {
        this.status.set('loading');

        try {
            this.apply(await this.repository.list());
        } catch {
            this.status.set('error');
        }
    }

    /** Aviso temprano de nombre en uso; la garantía es el índice único. */
    isNameTaken(name: string, exceptId?: string): boolean {
        const wanted = nameKey(name);

        return this.fields().some((field) => field.id !== exceptId && nameKey(field.name) === wanted);
    }

    /** Crea y devuelve la cancha (para dejarla elegida en la actividad). */
    async create(input: ExternalFieldInput): Promise<ExternalField | null> {
        let created: ExternalField | null = null;

        await this.run(async () => {
            created = await this.repository.create(cleanFieldInput(input));
        });

        return created;
    }

    update(id: string, input: ExternalFieldInput): Promise<void> {
        return this.run(() => this.repository.update(id, cleanFieldInput(input)));
    }

    retire(id: string): Promise<void> {
        return this.run(() => this.repository.retire(id));
    }

    private async run(operation: () => Promise<unknown>): Promise<void> {
        if (this.busy()) {
            return;
        }

        this.busy.set(true);

        try {
            await operation();
            await this.refresh();
        } catch (error) {
            if (error instanceof AppError && error.code === 'not_found') {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    private async refresh(): Promise<void> {
        try {
            this.apply(await this.repository.list());
        } catch {
            // Se conserva el catálogo visible.
        }
    }

    private apply(fields: readonly ExternalField[]): void {
        this.fields.set(fields);
        this.status.set(fields.length > 0 ? 'ready' : 'empty');
    }
}
