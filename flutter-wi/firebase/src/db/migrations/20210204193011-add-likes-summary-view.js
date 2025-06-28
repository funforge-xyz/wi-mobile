const up = queryInterface => queryInterface.sequelize.query(`
  CREATE OR REPLACE VIEW public."PostLikeSummaryDetails" 
  AS
  SELECT DISTINCT l."externalPostId" as "externalPostId",
         p."externalAuthorId" as "externalAuthorId",
         p."imageUrl" as "imageUrl",
         u."notifToken" as "userNotifToken",
         u."id" as "userId",
         p."id" as "id",
         p."createdAt" as "createdAt",
         p."modifiedAt" as "modifiedAt",
         pdn."lastLikeNotificationSentOn" as "lastNotificationSentOn",
         (
           SELECT COUNT (l1.id)
           FROM "Likes" l1
           WHERE l1."externalPostId" = p."externalPostId" AND l1."externalAuthorId" != p."externalAuthorId" AND l1."createdAt" BETWEEN pdn."lastLikeNotificationSentOn" AND now()
         ) as "totalLikesToNotify"
  FROM "Posts" p 
        INNER JOIN "PostNotificationDetails" pdn ON p."id" = pdn."postId"
        INNER JOIN "Users" u ON u."externalUserId" = p."externalAuthorId"
        INNER JOIN "Likes" l ON l."externalPostId" = p."externalPostId"
  WHERE pdn."isScheduledForLikeNotification" = True
`);


const down = queryInterface => queryInterface.sequelize.query(`
  DROP VIEW IF EXISTS public."PostLikeSummaryDetails"
`);

export {
  up,
  down
};