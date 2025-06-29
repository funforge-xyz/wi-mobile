
const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Comments', 'parentCommentId', {
    type: Sequelize.STRING,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'externalCommentId'
    }
  });
};

const down = async (queryInterface) => {
  await queryInterface.removeColumn('Comments', 'parentCommentId');
};

export { up, down };
