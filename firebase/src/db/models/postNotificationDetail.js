export default (sequelize, DataTypes) => {
  const PostNotificationDetail = sequelize.define('PostNotificationDetail', {
    postId: DataTypes.STRING,
    isScheduledForCommentNotification: DataTypes.BOOLEAN,
    isScheduledForLikeNotification: DataTypes.BOOLEAN,
    lastCommentNotificationSentOn: DataTypes.DATE,
    lastLikeNotificationSentOn: DataTypes.DATE,
  });

  PostNotificationDetail.aliases = () => ({
    Post: { model: 'Post', alias: 'post' }
  });

  PostNotificationDetail.associate = (models) => {
    PostNotificationDetail.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
  };

  return PostNotificationDetail;
};
