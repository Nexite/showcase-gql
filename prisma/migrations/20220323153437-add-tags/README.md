# Migration `20220323153437-add-tags`

This migration has been generated by Tyler Menezes at 3/23/2022, 11:34:38 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE TABLE "_ProjectToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
)

CREATE UNIQUE INDEX "_ProjectToTag_AB_unique" ON "_ProjectToTag"("A", "B")

CREATE INDEX "_ProjectToTag_B_index" ON "_ProjectToTag"("B")

ALTER TABLE "_ProjectToTag" ADD FOREIGN KEY("A")REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "_ProjectToTag" ADD FOREIGN KEY("B")REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20210817220151-slug-unique..20220323153437-add-tags
--- datamodel.dml
+++ datamodel.dml
@@ -1,7 +1,7 @@
 datasource db {
-  provider = "mysql"
-  url = "***"
+  provider = "postgresql"
+  url = "***"
 }
 generator client {
   provider = "prisma-client-js"
@@ -43,8 +43,15 @@
   UPVOTE
   GRIN
 }
+
+model Tag {
+  id String @id
+  projects Project[]
+}
+
+
 model Project {
   id        String   @id @default(cuid())
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
@@ -70,8 +77,9 @@
   metadata     Metadata[]
   metrics      Metric[]
   judgements   Judgement[]
   reactionCounts    ReactionCount[]
+  tags Tag[]
 }
 model Media {
   id        String   @id @default(cuid())
```


