const up = async (queryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_nearby_users(
      externalUserId varchar,
      latitude decimal,
      longitude decimal,
      radius int,
      minLat decimal,
      maxLat decimal,
      minLon decimal,
      maxLon decimal,
      r_limit int DEFAULT 100,
      r_offset int DEFAULT 0
    )
    returns table (
		"name" varchar,
		"email" varchar,
    "externalUserId" varchar,
    "currentNetworkId" varchar,
    "about" varchar,
		"imageUrl" varchar,
		"sameWiFi" boolean
	) language plpgsql
    as
    $$
    declare
	  current_network_id varchar;
      earth_radius int DEFAULT 6371;
    begin
      SELECT u."currentNetworkId"
	  FROM "Users" u
	  WHERE u."externalUserId" = externalUserId
	  LIMIT 1 INTO current_network_id;

    RETURN QUERY  
	  	SELECT 
			u."name" as "name",
			u."email" as "email",
			u."externalUserId" as "externalUserId",
      u."currentNetworkId" as "currentNetworkId",
      u."about" as "about",
			u."imageUrl" as "imageUrl",
			COALESCE(u."currentNetworkId" = current_network_id, false) as "sameWiFi"
	  	FROM "Users" u 
		WHERE ((u."lastUpdatedLatitude" BETWEEN minLat AND maxLat
			AND u."lastUpdatedLongitude" BETWEEN minLon AND maxLon)
			OR u."currentNetworkId" = current_network_id)
		  	AND u."externalUserId" != externalUserId
			AND u."isDeleted" = false
		ORDER BY "sameWiFi" DESC, acos(sin(radians(latitude))*sin(radians(u."lastUpdatedLatitude")) + cos(radians(latitude))*cos(radians(u."lastUpdatedLatitude"))*cos(radians(u."lastUpdatedLongitude")-radians(longitude)))*6371 ASC																						   
        LIMIT r_limit OFFSET r_offset;
    end;
    $$;
  `);
};

const down = async (queryInterface) => {
  await queryInterface.sequelize.query('DROP FUNCTION get_nearby_users');
}

export {
  up,
  down
};
