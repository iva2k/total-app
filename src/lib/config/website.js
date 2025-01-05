import websiteFnc from './websiteFnc.js';
import * as env from '$env/static/public';
const website = websiteFnc(env);
export { website as default };
