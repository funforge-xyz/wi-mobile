export default (sequelize, DataTypes) => {
  const PostLikeSummaryDetail = sequelize.define('PostLikeSummaryDetail', {
    postId: DataTypes.INTEGER,
    externalPostId: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    externalAuthorId: DataTypes.STRING,
    userNotifToken: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    lastNotificationSentOn: DataTypes.DATE,
    totalLikesToNotify: DataTypes.INTEGER,
  });

  PostLikeSummaryDetail.aliases = () => ({
    Post: { model: 'Post', alias: 'post' },
    User: { model: 'User', alias: 'user' }
  });

  PostLikeSummaryDetail.associate = (models) => {
    PostLikeSummaryDetail.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
    PostLikeSummaryDetail.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
  };


  return PostLikeSummaryDetail;
};
