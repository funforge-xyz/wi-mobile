import path from 'path';
import model from '../sequelizeModel';

export default model(__dirname, path.basename(module.filename));
