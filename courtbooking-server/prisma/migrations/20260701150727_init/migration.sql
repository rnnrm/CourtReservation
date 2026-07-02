-- CreateTable
CREATE TABLE "Users" (
    "Id" TEXT NOT NULL,
    "UserName" TEXT,
    "NormalizedUserName" TEXT,
    "Email" TEXT,
    "NormalizedEmail" TEXT,
    "PasswordHash" TEXT,
    "SecurityStamp" TEXT,
    "MemberNumber" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "Id" TEXT NOT NULL,
    "Name" TEXT,
    "NormalizedName" TEXT,
    "ConcurrencyStamp" TEXT,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UserRoles" (
    "UserId" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,

    CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("UserId","RoleId")
);

-- CreateTable
CREATE TABLE "Reservations" (
    "Id" TEXT NOT NULL,
    "Title" TEXT,
    "Start" TIMESTAMPTZ,
    "End" TIMESTAMPTZ,
    "Date" TIMESTAMPTZ,
    "AllDay" BOOLEAN,
    "ClassName" TEXT,
    "BackgroundColor" TEXT,
    "ExtendedProps_Owner" TEXT,
    "ExtendedProps_Court" INTEGER,
    "ExtendedProps_Description" TEXT,

    CONSTRAINT "Reservations_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Competitors" (
    "Id" TEXT NOT NULL,
    "Rating" DOUBLE PRECISION NOT NULL,
    "Rank" INTEGER,
    "Type" TEXT NOT NULL,
    "Competition" TEXT NOT NULL,
    "MatchesPlayed" INTEGER NOT NULL,

    CONSTRAINT "Competitors_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "MatchResults" (
    "Id" TEXT NOT NULL,
    "CompetitionName" TEXT NOT NULL,
    "WinnerId" TEXT NOT NULL,
    "LoserId" TEXT NOT NULL,
    "ReportedById" TEXT NOT NULL,
    "DatePlayed" TIMESTAMPTZ NOT NULL,
    "Score" INTEGER[],
    "Confirmed" BOOLEAN NOT NULL,
    "PointsChange" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MatchResults_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CompetitorPlayers" (
    "CompetitorId" TEXT NOT NULL,
    "AppUserId" TEXT NOT NULL,

    CONSTRAINT "CompetitorPlayers_pkey" PRIMARY KEY ("CompetitorId","AppUserId")
);

-- CreateTable
CREATE TABLE "NodeUsers" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NodeUsers_UserId_key" ON "NodeUsers"("UserId");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_ExtendedProps_Owner_fkey" FOREIGN KEY ("ExtendedProps_Owner") REFERENCES "Users"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
