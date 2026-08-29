CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerificationTokenHash" TEXT,
  "emailVerificationTokenExpires" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "refreshTokenExpires" TIMESTAMP(3) NOT NULL,
  "deviceInfo" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RespondentSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RespondentSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Survey" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "schema" JSONB NOT NULL,
  "acceptingResponses" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Response" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "respondentSessionId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_emailVerificationTokenHash_key" ON "User"("emailVerificationTokenHash");
CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE UNIQUE INDEX "RespondentSession_tokenHash_key" ON "RespondentSession"("tokenHash");
CREATE INDEX "RespondentSession_expiresAt_idx" ON "RespondentSession"("expiresAt");
CREATE INDEX "Survey_creatorId_createdAt_idx" ON "Survey"("creatorId", "createdAt");
CREATE UNIQUE INDEX "Response_surveyId_respondentSessionId_key" ON "Response"("surveyId", "respondentSessionId");
CREATE INDEX "Response_surveyId_status_idx" ON "Response"("surveyId", "status");
CREATE INDEX "Response_respondentSessionId_idx" ON "Response"("respondentSessionId");
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentSessionId_fkey" FOREIGN KEY ("respondentSessionId") REFERENCES "RespondentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
