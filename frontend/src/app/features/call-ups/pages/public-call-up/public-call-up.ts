import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
        <h1 class="m-0 border-b-2 border-(--p-text-color) pb-3">PlayerTech</h1>
        <p class="mt-4 text-lg">Pronto podrás responder aquí.</p>
    </main>`
})
export class PublicCallUpPage {}
