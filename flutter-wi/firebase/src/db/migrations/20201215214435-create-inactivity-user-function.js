const up = async (queryInterface) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS get_inactive_users; 
    `, { transaction });

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION get_inactive_users()
      returns table (
        "id" integer,
        "name" varchar,
        "notifToken" varchar,
		    "lastTimeSeen" timestamptz
      ) language plpgsql
      as
      $$
      declare
      lower_limit integer DEFAULT 11;
      upper_limit integer DEFAULT 18;
      upper_inactivity_interval varchar DEFAULT '4 hours';
      lower_inactivity_interval varchar DEFAULT '48 hours';
      opened_notification_interval varchar DEFAULT '6 hours';
      date_frame timestamptz;
      lower_inactivity_timestamp timestamptz;
      upper_inactivity_timestamp timestamptz;
      notification_sent_timeframe timestamptz;
      begin
        SELECT now() into date_frame;
        SELECT date_frame - upper_inactivity_interval::INTERVAL into upper_inactivity_timestamp;
        SELECT date_frame - lower_inactivity_interval::INTERVAL into lower_inactivity_timestamp;
        SELECT date_frame - opened_notification_interval::INTERVAL into notification_sent_timeframe;
        RETURN QUERY
          SELECT 
          u."id" as "id",
		      u."externalUserId" as "externalUserId",
          u."name" as "name",
          u."notifToken" as "notifToken",
          u."lastTimeSeen" as "lastTimeSeen"
          FROM "Users" u
          WHERE u."lastTimeSeen" AT TIME ZONE 'UTC' BETWEEN lower_inactivity_timestamp AND upper_inactivity_timestamp
          AND EXTRACT(hour from date_frame AT TIME ZONE COALESCE(timezone, 'CET')) BETWEEN lower_limit AND upper_limit
          AND NOT EXISTS (
            SELECT "targetUserId", "notificationTypeId", max("createdAt") as "maxCreatedAt"
            FROM "Notifications"
            WHERE "notificationTypeId" = 5 and "targetUserId" = u."id"
            GROUP BY "targetUserId", "notificationTypeId"
            HAVING max("createdAt") BETWEEN notification_sent_timeframe AND date_frame
          )
        ORDER BY u."id";
      end;
      $$;
    `, { transaction }
    );
  }
);

const down = async (queryInterface) => queryInterface.sequelize.transaction(
  async (transaction) => {
    await queryInterface.sequelize.query(`
      DROP FUNCTION  DROP FUNCTION get_inactive_users; 
    `, { transaction });
  }
);

export {
  up,
  down
};
