const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('UserLocationAudits', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    externalUserId: {
      type: Sequelize.STRING,
    },
    latitude: {
      type: Sequelize.DOUBLE
    },
    longitude: {
      type: Sequelize.DOUBLE
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    }
  });
};

const down = async (queryInterface) => {
  await queryInterface.dropTable('UserLocationAudits');
}

export {
  up,
  down
};
