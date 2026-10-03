-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('AG', 'UM', 'AM', 'DM', 'SDM', 'VP', 'AGP');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "parentId" TEXT,
    "recruiterId" TEXT,
    "agentCode" TEXT,
    "joinMonth" INTEGER,
    "joinYear" INTEGER,
    "photo" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "sessionSeenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "targetFYP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetNBC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetFYC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actual" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualFYP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualNBC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualFYC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualRYC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorYearNBC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "persistency" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agentStatus" TEXT,
    "personalUnitNBC" DOUBLE PRECISION,
    "newALPromotions" INTEGER NOT NULL DEFAULT 0,
    "newVPPromotions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Actual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "dataJson" JSONB NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_agentCode_key" ON "Member"("agentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Member_username_key" ON "Member"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_memberId_year_month_key" ON "Goal"("memberId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Actual_memberId_year_month_key" ON "Actual"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actual" ADD CONSTRAINT "Actual_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
