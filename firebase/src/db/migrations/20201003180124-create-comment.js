const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Comments', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    externalCommentId: {
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
  await queryInterface.dropTable('Comments');
};

export default {
  up,
  down
};
