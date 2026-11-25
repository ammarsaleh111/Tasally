// A failed identity lookup is not evidence that the visitor has no identity.
export async function lookupIdentity(fetcher = fetch, signal = AbortSignal.timeout(5000)) {
  const response = await fetcher('/api/identity/me', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Identity lookup failed');
  const payload = await response.json();
  if (payload?.ok !== true || !payload.data || !Object.hasOwn(payload.data, 'identity')) {
    throw new Error('Invalid identity response');
  }
  return payload.data.identity;
}
