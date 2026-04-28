import { execSync } from 'node:child_process';

const shouldRunReactSnap = process.env.RUN_REACT_SNAP === 'true';
const isVercel = Boolean(process.env.VERCEL);

if (!shouldRunReactSnap || isVercel) {
  console.log(
    '[postbuild] Skipping react-snap. Set RUN_REACT_SNAP=true to enable it locally.'
  );
  process.exit(0);
}

execSync('npx react-snap', { stdio: 'inherit' });