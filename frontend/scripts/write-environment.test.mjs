import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from './write-environment.mjs';

const VALID = { SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc123' };
const jwt = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma_de_prueba`;

test('acepta una URL https y una clave publicable', () => {
    assert.deepEqual(validateEnvironment(VALID), []);
});

test('exige la URL y la clave', () => {
    assert.deepEqual(validateEnvironment({}), ['Falta SUPABASE_URL.', 'Falta SUPABASE_PUBLISHABLE_KEY.']);
});

test('rechaza una URL sin https', () => {
    assert.match(validateEnvironment({ ...VALID, SUPABASE_URL: 'http://abcdefghijklmnop.supabase.co' })[0], /https/);
});

test('rechaza una clave secreta sb_secret_', () => {
    assert.match(validateEnvironment({ ...VALID, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc123' })[0], /privilegiada/);
});

test('rechaza una clave antigua service_role y acepta la anon', () => {
    assert.match(validateEnvironment({ ...VALID, SUPABASE_PUBLISHABLE_KEY: jwt({ role: 'service_role' }) })[0], /privilegiada/);
    assert.deepEqual(validateEnvironment({ ...VALID, SUPABASE_PUBLISHABLE_KEY: jwt({ role: 'anon' }) }), []);
});
