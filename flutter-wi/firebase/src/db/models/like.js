// TODO: Consider introducing externalCreatedAt and externalUpdatedAt dates.
export default (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    externalLikeId: DataTypes.STRING,
    postId: DataTypes.INTEGER,
    externalPostId: DataTypes.STRING,
    externalAuthorId: DataTypes.STRING
  });

  Like.aliases = () => ({
    Post: { model: 'Post', alias: 'post' }
  });

  Like.associate = (models) => {
    Like.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
  };

  return Like;
};
