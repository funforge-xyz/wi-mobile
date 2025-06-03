const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Posts', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
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
  await queryInterface.dropTable('Posts');
};

export default {
  up,
  down
};
