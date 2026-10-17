import { ErrorHandler, inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGES } from './error-messages';

/** Registra los errores no controlados y muestra un aviso genérico (FR-016). */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private readonly messages = inject(MessageService);

    handleError(error: unknown): void {
        console.error(error);
        this.messages.add({ severity: 'error', summary: 'Error', detail: ERROR_MESSAGES.unknown });
    }
}
