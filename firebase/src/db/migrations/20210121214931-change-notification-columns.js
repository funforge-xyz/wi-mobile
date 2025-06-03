const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.changeColumn(
      'Notifications',
      'externalNotificationId',
      {
        type: Sequelize.STRING,
        allowNull: true  
      }, { transaction }
    );
    
    await queryInterface.changeColumn(
      'Notifications',
      'externalNotificationId',
      {
        type: Sequelize.STRING,
        allowNull: true  
      }, { transaction }
    );

  }
);

const down = async (queryInterface) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.changeColumn(
      'Notifications',
      'externalNotificationId',
      {
        type: Sequelize.STRING,
        allowNull: false  
      }, { transaction }
    );
  }
);

export {
  up,
  down
};
