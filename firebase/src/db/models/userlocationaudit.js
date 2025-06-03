// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const UserLocationAudit = sequelize.define('UserLocationAudit', {
    externalUserId: DataTypes.STRING,
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE
  });

  return UserLocationAudit;
};
