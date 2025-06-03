// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    externalCommentId: DataTypes.STRING,
    postId: DataTypes.INTEGER,
    externalPostId: DataTypes.STRING,
    externalAuthorId: DataTypes.STRING
  });

  Comment.aliases = () => ({
    Post: { model: 'Post', alias: 'post' }
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
  };

  return Comment;
};
