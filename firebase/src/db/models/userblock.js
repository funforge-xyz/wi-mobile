export default (sequelize, DataTypes) => {
  const UserBlock = sequelize.define('UserBlock', {
    // userId: DataTypes.INTEGER,
    // blockedUserId: DataTypes.INTEGER,
    externalUserId: DataTypes.STRING,
    blockedUserExternalId: DataTypes.STRING
  });

  // UserBlock.aliases = () => ({
  //   User: { model: 'User', alias: 'user' },
  //   BlockedUser: { model: 'User', alias: 'blockedUser' }
  // });

  // UserBlock.associate = (models) => {
  //   UserBlock.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
  //   UserBlock.belongsTo(models.User, { foreignKey: 'blockedUserId', targetKey: 'id', as: 'blockedUser' });
  // };

  return UserBlock;
};
