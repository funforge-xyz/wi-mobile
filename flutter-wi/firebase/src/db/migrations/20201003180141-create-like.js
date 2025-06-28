const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Likes', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    externalLikeId: {
      type: Sequelize.STRING,
    },
    postId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Posts',
        key: 'id'
      }
    },
    externalPostId: {
      type: Sequelize.STRING,
    },
    externalAuthorId: {
      type: Sequelize.STRING,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
};

const down = async (queryInterface) => {
  await queryInterface.dropTable('Likes');
};

export default {
  up,
  down
};
