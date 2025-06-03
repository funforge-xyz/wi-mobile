const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.addColumn(
      'Posts',
      'imageUrl',
      {
        type: Sequelize.STRING,
        allowNull: true  
      }, { transaction }
    );
  }
);

const down = async (queryInterface) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.removeColumn(
      'posts',
      'imageUrl',
      { transaction }
    );
  }
);

export {
  up,
  down
};
