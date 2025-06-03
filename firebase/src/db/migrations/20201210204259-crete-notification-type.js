const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.createTable('NotificationTypes', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      code: {
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

    await queryInterface.bulkInsert(
      'NotificationTypes',
      [
        {
          id: 1,
          name: 'Initial Comment',
          code: 'INITIAL_COMMENT',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Initial Like',
          code: 'INITIAL_LIKE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Comments Summary',
          code: 'COMMENT_SUMMARY',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          name: 'Likes Summary',
          code: 'LIKE_SUMMARY',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 5,
          name: 'User Inactivity Notification',
          code: 'USER_INACTIVITY_NOTIFICATION',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction }
    );
  }
);

const down = async (queryInterface) => {
  await queryInterface.dropTable('NotificationTypes');
};

export default {
  up,
  down
};
