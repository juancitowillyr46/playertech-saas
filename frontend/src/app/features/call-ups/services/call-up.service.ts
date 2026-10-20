import { computed, inject, Injectable, signal } from '@angular/core';
import { PlayerRepository } from '../../players/data/player.repository';
import { Activity } from '../../activities/models/activity.models';
import { CallUp, CallUpListInput } from '../models/call-up.models';
import { CallUpRepository } from '../data/call-up.repository';
@Injectable()
export class CallUpService {
    private readonly repository = inject(CallUpRepository);
    private readonly players = inject(PlayerRepository);
    readonly callUp = signal<CallUp | null>(null);
    readonly busy = signal(false);
    private activity: Activity | null = null;
    readonly isOpen = computed(() => {
        const c = this.callUp(),
            a = this.activity;
        return !!c && !!a && !c.closedAt && Date.now() < new Date(c.deadline ?? a.startsAt).getTime();
    });
    async load(activity: Activity) {
        this.activity = activity;
        this.callUp.set(await this.repository.getByActivity(activity.id));
    }
    candidates() {
        return this.players.listPlayers().then((p) => p.filter((x) => x.isActive));
    }
    async create(deadline: string | null, lists: readonly CallUpListInput[]) {
        await this.run(() => this.repository.create(this.activity!.id, deadline, lists));
    }
    async add(listId: string, ids: readonly string[]) {
        await this.run(() => this.repository.addPlayers(this.callUp()!, listId, ids));
    }
    async remove(playerId: string) {
        await this.run(() => this.repository.removePlayer(this.callUp()!.id, playerId));
    }
    async move(playerId: string, listId: string) {
        await this.run(() => this.repository.movePlayer(this.callUp()!.id, playerId, listId));
    }
    async deadline(value: string | null) {
        await this.run(() => this.repository.setDeadline(this.callUp()!.id, value));
    }
    async close() {
        await this.run(() => this.repository.close(this.callUp()!.id));
    }
    async saveIntro(listId: string, intro: string | null) {
        await this.run(() => this.repository.saveIntro(listId, intro));
    }
    private async run(action: () => Promise<void>) {
        if (this.busy() || !this.activity) return;
        this.busy.set(true);
        try {
            await action();
            await this.load(this.activity);
        } finally {
            this.busy.set(false);
        }
    }
}
