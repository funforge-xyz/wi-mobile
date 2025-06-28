const up = async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.addColumn(
      'Users',
      'lastUpdatedLocation', {
        type: Sequelize.DATE
      }, { transaction }
    );

    await queryInterface.sequelize.query(`
      UPDATE "Users" u
      SET "lastUpdatedLocation" = (
        SELECT l."maxDate"
        FROM ( SELECT ul."externalUserId", MAX(ul."createdAt") "maxDate"
            FROM "UserLocationAudits" ul
            GROUP BY ul."externalUserId" ) l
        WHERE l."externalUserId" = u."externalUserId"
      );
      `, { transaction });
  }
);

const down = async (queryInterface, Sequelize) => queryInterface.removeColumn(
  'Users',
  'lastUpdatedLocation'
);

export {
  up,
  down
};
