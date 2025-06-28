/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import { logger } from 'firebase-functions';
import configuration from '../config';

const logQuery = (query, time) => {
  logger.info('SQL Query', {
    time,
    query,
  });
};

const initModel = (dirname, basename) => {
  const db = {};
  const config = { ...configuration };
  const dbConfig = {
    host: config.pghost,
    port: config.pgport,
    dialect: config.pgdialect,
    dialectOptions: { 
      statement_timeout: config.pgtimeout,
      ...(config.socketPath ? {
        socketPath: config.socketPath
      } : {})
    },
    benchmark: true,
    logging: logQuery,
    pool: {
      max: 1,
      min: 0,
      idle: 0,
      acquire: 60000,
      evict: 0,
    },
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    minifyAliases: true
  };

  const sequelize = new Sequelize(
    config.pgdatabase,
    config.pgusername,
    config.pgpassword,
    dbConfig
  );
  sequelize.addHook('beforeCount', (options) => {
    if (options.include && options.include.length > 0) {
      options.distinct = true;
    }
  });

  fs.readdirSync(dirname)
    .filter(
      (file) =>
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    )
    .forEach((file) => {
      const dir = require(path.join(dirname, file));
      const model = dir.default(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

export default initModel;
