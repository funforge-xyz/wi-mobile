const up = async (queryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_most_engaged_posts(
      external_user_id varchar,
      minLat decimal,
      maxLat decimal,
      minLon decimal,
      maxLon decimal,
      postTimeframe varchar default '7 days',
      engagementTimeframe varchar default '1 days',
      r_limit int default 100,
      r_offset int default 0)
    returns table (
        "externalPostId" varchar,
        "createdAt" timestamptz
      ) language plpgsql
    as
    $$
    declare
      like_weight int;
      comment_weight int;
      current_date timestamptz;
      engagement_date_frame timestamptz;
      post_date_frame timestamptz;
    begin
      SELECT now() - engagementTimeframe::INTERVAL into engagement_date_frame;
      SELECT now() - postTimeframe::INTERVAL into post_date_frame;
      SELECT value::INT into comment_weight FROM "AppSettings" WHERE key = 'CommentWeight';
      SELECT value::INT into like_weight FROM "AppSettings" WHERE key = 'LikeWeight';

      RETURN QUERY
	      SELECT p1."externalPostId" as "externalPostId", p1."createdAt" as "createdAt"
        FROM "Posts" p1 LEFT OUTER JOIN (
          SELECT c."postId", COUNT(p.id)*comment_weight as comments_num
          FROM "Comments" c
            INNER JOIN "Posts" p on c."postId" = p.id
          WHERE p."externalAuthorId" != c."externalAuthorId"
            AND c."createdAt" >= engagement_date_frame
            AND p."createdAt" >= post_date_frame
          GROUP BY c."postId") cs ON cs."postId" = p1."id"
        LEFT OUTER JOIN (
          SELECT l."postId", COUNT(p.id)*like_weight as likes_num
          FROM "Likes" l
            INNER JOIN "Posts" p on l."postId" = p.id
          WHERE p."externalAuthorId" != l."externalAuthorId"
            AND l."createdAt" >= engagement_date_frame
            AND p."createdAt" >= post_date_frame
          GROUP BY l."postId") ls ON ls."postId" = p1."id"
        INNER JOIN (
          SELECT u."externalUserId" as "externalUserId"
          FROM "Users" u
          WHERE u."lastUpdatedLatitude" BETWEEN minLat AND maxLat
            AND u."lastUpdatedLongitude" BETWEEN minLon AND maxLon
        ) loc ON loc."externalUserId" = p1."externalAuthorId"
        WHERE COALESCE(ls.likes_num, 0) + COALESCE(cs.comments_num,0) > 0
          AND p1."externalAuthorId" != external_user_id
          AND p1."createdAt" >= post_date_frame
        ORDER BY COALESCE(ls.likes_num, 0) + COALESCE(cs.comments_num,0) DESC
        LIMIT r_limit OFFSET r_offset;
    end;
    $$;
    `);
};

const down = async (queryInterface) => {
  await queryInterface.sequelize.query('DROP FUNCTION get_most_engaged_posts');
}

export {
  up,
  down
};
