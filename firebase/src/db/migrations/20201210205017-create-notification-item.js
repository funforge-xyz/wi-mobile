const up = async (queryInterface, Sequelize) => await queryInterface.createTable('Notifications', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    externalNotificationId: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    title: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    body: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    creatorUserExternalId: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    targetUserId: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    targetUserExternalId: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    dateOpened: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    dateRead: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    notificationData: {
      allowNull: true,
      type: Sequelize.JSON
    },
    notificationTypeId: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'NotificationTypes',
        key: 'id'
      }
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }
);

const down = async (queryInterface) => {
  await queryInterface.dropTable('Notifications');
};

export default {
  up,
  down
};
