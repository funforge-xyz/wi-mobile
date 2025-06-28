import configuration from '../config';

const pgConfig = {
  database: configuration.pgdatabase,
  username: configuration.pgusername,
  password: configuration.pgpassword,
  dialect: configuration.pgdialect,
  host: configuration.pghost,
  port: configuration.pgport,
  migrationStorageTableName: configuration.pgMigrationStorageTableName,
  seederStorage: configuration.pgSeederStorage,
  seederStorageTableName: configuration.pgSeederStorageTableName,
}

if (configuration.socketPath) {
  delete pgConfig.host;
  pgConfig.dialectOptions.socketPath = configuration.socketPath;
}

module.exports = pgConfig;
