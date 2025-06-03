const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('UserBlocks', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    // userId: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: 'Users',
    //     key: 'id'
    //   }
    // },
    externalUserId: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: 'Users',
        key: 'externalUserId'
      }
    },
    // blockedUserId: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: 'Users',
    //     key: 'id'
    //   }
    // },
    blockedUserExternalId: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: 'Users',
        key: 'externalUserId'
      }
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
  await queryInterface.dropTable('UserBlocks');
}

export {
  up,
  down
};
