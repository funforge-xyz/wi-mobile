// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    externalUserId: DataTypes.STRING,
    lastUpdatedLatitude: DataTypes.DOUBLE,
    lastUpdatedLongitude: DataTypes.DOUBLE,
    currentNetworkId: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    isDeleted: DataTypes.BOOLEAN,
    notifToken: DataTypes.STRING,
    about: DataTypes.STRING,
    notifyMe: DataTypes.BOOLEAN,
    lastUpdatedLocation: DataTypes.DATE,
    lastTimeSeen: DataTypes.BOOLEAN,
    timezone: DataTypes.STRING,
  });

  User.aliases = () => ({
    Posts: { model: 'Post', alias: 'posts' }
  });

  // User.associate = (models) => {
  //   User.hasMany(models.Post, { foreignKey: 'externalUserId', as: 'posts' });
  // };

  return User;
};
