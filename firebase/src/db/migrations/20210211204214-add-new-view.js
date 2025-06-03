const up = async (queryInterface) => queryInterface.sequelize.query(`
  CREATE OR REPLACE VIEW public."CommentLikeSummaryDetails" 
  AS
  SELECT al."externalPostId", 
    al."externalAuthorId",
    al."imageUrl",
    al."userNotifToken",
    al."userId",
    al."postId",
    al.id,
    al."createdAt",
    al."updatedAt",
    al."lastCommentNotificationSentOn",
    al."lastLikeNotificationSentOn",
    al."totalCommentsToNotify",
    al."totalLikesToNotify"
   FROM ( SELECT DISTINCT p."externalPostId",
            p."externalAuthorId",
            p."imageUrl",
            u."notifToken" AS "userNotifToken",
            u.id AS "userId",
            p.id AS "postId",
            pdn.id,
            p."createdAt",
            p."updatedAt",
            pdn."lastCommentNotificationSentOn",
            pdn."lastLikeNotificationSentOn",
            (
              SELECT count(c1.id) AS count
              FROM "Comments" c1
              WHERE c1."externalPostId"::text = p."externalPostId"::text AND c1."externalAuthorId"::text <> p."externalAuthorId"::text AND c1."createdAt" >= pdn."lastCommentNotificationSentOn" AND c1."createdAt" <= now()
            ) AS "totalCommentsToNotify",
            (
              SELECT count(l1.id) AS count
              FROM "Likes" l1
              WHERE l1."externalPostId"::text = p."externalPostId"::text AND l1."externalAuthorId"::text <> p."externalAuthorId"::text AND l1."createdAt" >= pdn."lastLikeNotificationSentOn" AND l1."createdAt" <= now()
            ) AS "totalLikesToNotify"
            FROM "Posts" p
            JOIN "PostNotificationDetails" pdn ON p.id = pdn."postId"
            JOIN "Users" u ON u."externalUserId"::text = p."externalAuthorId"::text
          WHERE pdn."isScheduledForCommentNotification" = true OR pdn."isScheduledForLikeNotification" = true) al
  WHERE al."totalCommentsToNotify" > 0 OR al."totalLikesToNotify" > 0
`);

const down = async () => {};

export {
  up,
  down
};
