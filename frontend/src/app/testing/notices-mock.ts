import { signal } from '@angular/core';
import { NewResponsesNotice } from '../core/notices/notices.models';
import { NoticesService } from '../core/notices/notices.service';

/**
 * `NoticesService` simulado para las pruebas (spec 014): los servicios que validan o marcan
 * visto lo refrescan, y el inicio y la navegación leen sus signals.
 */
export function noticesMock(options: { pendingCount?: number; newResponses?: NewResponsesNotice[]; failed?: boolean } = {}) {
    const service = {
        pendingCount: signal(options.pendingCount ?? 0),
        newResponses: signal<readonly NewResponsesNotice[]>(options.newResponses ?? []),
        failed: signal(options.failed ?? false),
        refresh: vi.fn().mockResolvedValue(undefined)
    };

    return { provide: NoticesService, useValue: service };
}
