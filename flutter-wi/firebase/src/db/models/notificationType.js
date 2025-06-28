export default (sequelize, DataTypes) => {
  const NotificationType = sequelize.define('NotificationType', {
    name: DataTypes.STRING,
    code: DataTypes.STRING,
  });

  return NotificationType;
};
