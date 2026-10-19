/**
 * Cliente de Supabase simulado para las pruebas de repositorios (spec 009). Cada consulta
 * terminada (esperar la cadena, `single`, `maybeSingle` o `rpc`) consume la siguiente
 * respuesta de `results`; `calls` registra cada método con su tabla y argumentos.
 */
export interface MockResult {
    data: unknown;
    error: unknown;
}

const CHAIN_METHODS = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'in', 'order', 'gte', 'lt'];

export function supabaseClientMock(results: MockResult[]) {
    const queue = [...results];
    const calls: { table: string; method: string; args: unknown[] }[] = [];
    const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });

    const from = vi.fn((table: string) => {
        const chain: Record<string, unknown> = {};

        for (const method of CHAIN_METHODS) {
            chain[method] = (...args: unknown[]) => {
                calls.push({ table, method, args });
                return chain;
            };
        }

        chain['single'] = next;
        chain['maybeSingle'] = next;
        chain['then'] = (resolve: (value: MockResult) => unknown, reject?: (reason: unknown) => unknown) => next().then(resolve, reject);

        return chain;
    });

    const rpc = vi.fn(() => next());

    /** Argumentos de cada llamada a `method`, opcionalmente solo de una tabla. */
    const args = (method: string, table?: string) => calls.filter((call) => call.method === method && (!table || call.table === table)).map((call) => call.args);

    return { client: { from, rpc }, from, rpc, args };
}

export const pgError = (code: string) => ({ code, message: 'postgrest', details: null, hint: null });
