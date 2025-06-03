// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    externalPostId: DataTypes.STRING,
    externalAuthorId: DataTypes.INTEGER,
    imageUrl: DataTypes.STRING,
  });

  Post.aliases = () => ({
    Comments: { model: 'Comment', alias: 'comments' },
    Likes: { model: 'Like', alias: 'likes' },
    PostNotificationDetail: { model: 'PostNotificationDetail', alias: 'postNotificationDetail' }
    //User: { model: 'User', alias: 'user' }
  });

  Post.associate = (models) => {
    Post.hasMany(models.Comment, { foreignKey: 'postId', as: 'comments' });
    Post.hasMany(models.Like, { foreignKey: 'postId', as: 'likes' });
    Post.hasOne(models.PostNotificationDetail, { foreignKey: 'postId', as: 'postNotificationDetail'})
    //Post.belongsTo(models.User, { foreignKey: 'externalAuthorId', targetKey: 'externalUserId', as: 'user' });
  };

  return Post;
};
