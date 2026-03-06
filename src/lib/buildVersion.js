import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cache } from 'react';

function readBuildIdFromDisk() {
  try {
    return readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    return null;
  }
}

export const getBuildVersion = cache(() => {
  return (
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_BUILD_ID ||
    readBuildIdFromDisk() ||
    'dev'
  );
});