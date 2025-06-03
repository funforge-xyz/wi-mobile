const up = queryInterface => queryInterface.sequelize.query(`
  CREATE OR REPLACE VIEW public."PostCommentSummaryDetails" 
  AS
  SELECT DISTINCT l."externalPostId" as "externalPostId",
         p."externalAuthorId" as "externalAuthorId",
         p."imageUrl" as "imageUrl",
         u."notifToken" as "userNotifToken",
         u."id" as "userId",
         p."id" as "id",
         p."createdAt" as "createdAt",
         p."modifiedAt" as "modifiedAt",
         pdn."lastCommentNotificationSentOn" as "lastNotificationSentOn",
         (
           SELECT COUNT (l1.id)
           FROM "Comments" l1
           WHERE l1."externalPostId" = p."externalPostId" AND l1."externalAuthorId" != p."externalAuthorId" AND l1."createdAt" BETWEEN pdn."lastCommentNotificationSentOn" AND now()
         ) as "totalCommentsToNotify"
  FROM "Posts" p 
        INNER JOIN "PostNotificationDetails" pdn ON p."id" = pdn."postId"
        INNER JOIN "Users" u ON u."externalUserId" = p."externalAuthorId"
        INNER JOIN "Comments" l ON l."externalPostId" = p."externalPostId"
  WHERE pdn."isScheduledForCommentNotification" = True
`);


const down = queryInterface => queryInterface.sequelize.query(`
  DROP VIEW IF EXISTS public."PostCommentSummaryDetails"
`);

export {
  up,
  down
};