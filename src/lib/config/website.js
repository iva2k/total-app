import websiteFnc from './websiteFnc.js';
// TODO: (when needed) Figure out a fix for ESLint 'import-x/no-unresolved' error on '$env/static/public'
// eslint-disable-next-line import-x/no-unresolved
import * as env from '$env/static/public';
const website = websiteFnc(env);
export { website as default };
