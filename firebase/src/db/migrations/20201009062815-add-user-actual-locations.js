const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    currentNetworkId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    imageUrl: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    about: {
      type: Sequelize.STRING(500)
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    externalUserId: {
      type: Sequelize.STRING,
      unique: true
    },
    lastUpdatedLatitude: {
      type: Sequelize.DOUBLE
    },
    lastUpdatedLongitude: {
      type: Sequelize.DOUBLE
    },
    notifToken: {
      type: Sequelize.STRING(500)
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
  await queryInterface.dropTable('Users');
}

export {
  up,
  down
};
