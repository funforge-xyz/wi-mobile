import Dispatcher from '../../web/dispatcher';
import routes from '../../web/routes';

const restApiHandler = async (req, res) => {
  const dispatcher = new Dispatcher(routes);
  const resultObj = await dispatcher.dispatch(req);

  res.status(resultObj.statusCode).send(resultObj.result);
};

export default restApiHandler;
