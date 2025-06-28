const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.addColumn(
      'Users',
      'notifyMe',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false  
      }, { transaction }
    );

    await queryInterface.addColumn(
      'Users',
      'lastTimeSeen',
      {
        type: Sequelize.DATE,
        allowNull: true  
      }, { transaction }
    );

    await queryInterface.addColumn(
      'Users',
      'timezone',
      {
        type: Sequelize.STRING,
        allowNull: true  
      }, { transaction }
    );
  }
);

const down = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.removeColumn(
      'Users',
      'notifyMe',
      { transaction }
    );
    
    await queryInterface.removeColumn(
      'Users',
      'lastTimeSeen',
      { transaction }
    );

    await queryInterface.removeColumn(
      'Users',
      'timezone',
      { transaction }
    );
  }
);

export {
  up,
  down
};
