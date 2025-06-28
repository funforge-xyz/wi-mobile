// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    externalNotificationId: DataTypes.STRING,
    title: DataTypes.STRING,
    body: DataTypes.STRING,
    creatorUserExternalId: DataTypes.STRING,
    targetUserId: DataTypes.INTEGER,
    targetUserExternalId: DataTypes.STRING,
    dateOpened: DataTypes.DATE,
    dateRead: DataTypes.DATE,
    notificationData: DataTypes.JSON,
    notificationTypeId: DataTypes.INTEGER,
  });

  Notification.aliases = () => ({
    CreatorUser: { model: 'User', alias: 'creatorUser' },
    TargetUser: { model: 'User', alias: 'targetUser' }
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'creatorUserExternalId', targetKey: 'id', as: 'creatorUser' });
    Notification.belongsTo(models.User, { foreignKey: 'targetUserExternalId', targetKey: 'id', as: 'targetUser' });
  };

  return Notification;
};
