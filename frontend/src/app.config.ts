import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeEsCO from '@angular/common/locales/es-CO';
import { ApplicationConfig, ErrorHandler, inject, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { AcademyContextRepository } from './app/core/academy-context/data/academy-context.repository';
import { SupabaseAcademyContextRepository } from './app/core/academy-context/data/supabase-academy-context.repository';
import { AuthService } from './app/core/auth/auth.service';
import { AuthRepository } from './app/core/auth/data/auth.repository';
import { SupabaseAuthRepository } from './app/core/auth/data/supabase-auth.repository';
import { APP_CONFIG, validateAppConfig } from './app/core/config/app-config';
import { LegalDocumentsRepository } from './app/core/legal/data/legal-documents.repository';
import { SupabaseLegalDocumentsRepository } from './app/core/legal/data/supabase-legal-documents.repository';
import { HomeSummaryRepository } from './app/features/home/data/home-summary.repository';
import { SupabaseHomeSummaryRepository } from './app/features/home/data/supabase-home-summary.repository';
import { SupabaseVenueRepository } from './app/features/venues/data/supabase-venue.repository';
import { VenueRepository } from './app/features/venues/data/venue.repository';
import { FileStorageRepository } from './app/core/storage/data/file-storage.repository';
import { SupabaseFileStorageRepository } from './app/core/storage/data/supabase-file-storage.repository';
import { GlobalErrorHandler } from './app/core/errors/global-error-handler';
import { PRIMENG_ES } from './app/core/i18n/primeng-es';
import { createSupabaseClient, SUPABASE_CLIENT } from './app/core/supabase/supabase-client';
import { PlayerTechPreset } from './app/core/theme/playertech-preset';
import { environment } from './environments/environment';

registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation(), withComponentInputBinding()),
        provideHttpClient(withFetch()),
        provideZonelessChangeDetection(),
        // Estilos de PrimeNG en su propia capa, bajo las utilidades de Tailwind (orden en _core.scss).
        providePrimeNG({ theme: { preset: PlayerTechPreset, options: { darkModeSelector: '.app-dark', cssLayer: { name: 'primeng', order: 'theme, base, sakai, primeng, components, utilities' } } }, translation: PRIMENG_ES }),
        { provide: LOCALE_ID, useValue: 'es-CO' },
        MessageService,
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        { provide: APP_CONFIG, useFactory: () => validateAppConfig(environment) },
        { provide: SUPABASE_CLIENT, useFactory: () => createSupabaseClient(inject(APP_CONFIG)) },
        { provide: AuthRepository, useClass: SupabaseAuthRepository },
        { provide: AcademyContextRepository, useClass: SupabaseAcademyContextRepository },
        { provide: LegalDocumentsRepository, useClass: SupabaseLegalDocumentsRepository },
        { provide: FileStorageRepository, useClass: SupabaseFileStorageRepository },
        { provide: VenueRepository, useClass: SupabaseVenueRepository },
        { provide: HomeSummaryRepository, useClass: SupabaseHomeSummaryRepository },
        provideAppInitializer(() => inject(AuthService).restore())
    ]
};
