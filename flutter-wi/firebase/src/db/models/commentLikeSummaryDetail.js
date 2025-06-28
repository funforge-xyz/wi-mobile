export default (sequelize, DataTypes) => {
  const CommentLikeSummaryDetail = sequelize.define('CommentLikeSummaryDetail', {
    postId: DataTypes.INTEGER,
    externalPostId: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    externalAuthorId: DataTypes.STRING,
    userNotifToken: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    lastLikeNotificationSentOn: DataTypes.DATE,
    lastCommentNotificationSentOn: DataTypes.DATE,
    totalCommentsToNotify: DataTypes.INTEGER,
    totalLikesToNotify: DataTypes.INTEGER
  });

  CommentLikeSummaryDetail.aliases = () => ({
    Post: { model: 'Post', alias: 'post' },
    User: { model: 'User', alias: 'user' }
  });

 CommentLikeSummaryDetail.associate = (models) => {
    CommentLikeSummaryDetail.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
    CommentLikeSummaryDetail.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
  };

  return CommentLikeSummaryDetail;
};
