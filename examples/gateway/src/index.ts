import createGateway from '@jc68124/auth-gateway-cf';
import config from './config';

export default createGateway(config);

export { SessionDO } from '@jc68124/auth-gateway-cf';