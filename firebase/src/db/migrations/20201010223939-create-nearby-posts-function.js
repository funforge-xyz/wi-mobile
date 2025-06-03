const up = async (queryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_nearby_posts(
      externalUserId varchar,
      minLat decimal,
      maxLat decimal,
      minLon decimal,
      maxLon decimal,
      timeframe varchar DEFAULT '1 days',
      r_limit int DEFAULT 100,
      r_offset int DEFAULT 0
    )
    returns table (
        "externalPostId" varchar,
        "createdAt" timestamptz
      ) language plpgsql
    as
    $$
    declare
      date_frame timestamptz;
      earth_radius int DEFAULT 6371;
    begin
      SELECT now() - timeframe::INTERVAL into date_frame;

      RETURN QUERY
          SELECT loc."externalPostId", loc."createdAt"
          FROM (
          SELECT p."id", u."lastUpdatedLatitude" as lat, u."lastUpdatedLongitude" as lon, p."externalPostId" as "externalPostId", p."createdAt" as "createdAt"
            FROM "Posts" p INNER JOIN "Users" u ON u."externalUserId" = p."externalAuthorId" 
            WHERE u."lastUpdatedLatitude" BETWEEN minLat AND maxLat
              AND u."lastUpdatedLongitude" BETWEEN minLon AND maxLon
              AND u."externalUserId" != externalUserId
              AND p."createdAt" >= date_frame 
        ) as loc
        ORDER BY loc."createdAt" DESC																						   
        LIMIT r_limit OFFSET r_offset;
        end;
    $$;
    `);
};

const down = async (queryInterface) => {
  await queryInterface.sequelize.query('DROP FUNCTION get_nearby_posts');
}

export {
  up,
  down
};
