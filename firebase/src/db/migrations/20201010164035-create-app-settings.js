const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.createTable('AppSettings', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      key: {
        type: Sequelize.STRING,
      },
      value: {
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
    }, { transaction });

    await queryInterface.bulkInsert('AppSettings', [{
      id: 1,
      key: 'CommentWeight',
      value: '3',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      key: 'LikeWeight',
      value: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { transaction });

});

const down = async (queryInterface) => {
  await queryInterface.dropTable('AppSettings');
};

export default {
  up,
  down
};
