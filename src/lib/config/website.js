import websiteFnc from '$lib/config/websiteFnc.js';
// TODO: (when needed) Figure out a fix for ESLint 'import/no-unresolved' error on '$env/static/public'
// eslint-disable-next-line import/no-unresolved
import * as env from '$env/static/public';
const website = websiteFnc(env);
export { website as default };
