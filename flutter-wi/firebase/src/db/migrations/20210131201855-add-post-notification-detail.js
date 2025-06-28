const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('PostNotificationDetails', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    postId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Posts',
        key: 'id'
      }
    },
    isScheduledForCommentNotification: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isScheduledForLikeNotification: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lastCommentNotificationSentOn: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    lastLikeNotificationSentOn: {
      type: Sequelize.DATE,
      allowNull: true
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
  await queryInterface.dropTable('PostNotificationDetail');
}

export {
  up,
  down
};
