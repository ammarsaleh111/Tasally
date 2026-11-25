// A POST resolves an existing player or assigns a number to a first-time visitor.
export async function lookupIdentity(fetcher = fetch, signal) {
  const controller = new AbortController();
  const timer = signal ? undefined : setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher('/api/identity/me', {
      method: 'POST', signal: signal ?? controller.signal, cache: 'no-store',
    });
    if (!response.ok) throw new Error('Identity initialization failed');
    const payload = await response.json();
    const identity = payload?.data?.identity;
    if (!payload?.ok || !identity?.id || !identity.displayName) throw new Error('Invalid identity response');
    return identity;
  } finally {
    clearTimeout(timer);
  }
}
