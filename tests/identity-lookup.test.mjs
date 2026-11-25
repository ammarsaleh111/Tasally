import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupIdentity } from '../src/components/identityLookup.mjs';

const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
test('initialization requires a persisted identity', async () => {
  await assert.rejects(lookupIdentity(async () => response({ok:true,data:{identity:null}})));
});
test('existing identity is preserved', async () => {
  const identity = {id:'test',displayName:'Player'};
  assert.deepEqual(await lookupIdentity(async () => response({ok:true,data:{identity}})), identity);
});
test('HTTP failures are not treated as guests', async () => {
  await assert.rejects(lookupIdentity(async () => response({ok:false},503)));
});
test('malformed responses are not treated as guests', async () => {
  await assert.rejects(lookupIdentity(async () => response({ok:true,data:{}})));
});
test('network failures propagate', async () => {
  await assert.rejects(lookupIdentity(async () => {throw new Error('offline');}));
});
test('request uses no-store and an abort signal', async () => {
  const signal = new AbortController().signal;
  await lookupIdentity(async (url, options) => {
    assert.equal(url,'/api/identity/me');
    assert.equal(options.method,'POST');
    assert.equal(options.signal,signal);
    assert.equal(options.cache,'no-store');
    return response({ok:true,data:{identity:{id:"new",displayName:"anonymous1"}}});
  },signal);
});
