-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MappingStatus" AS ENUM ('SUSPECTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "QueryLang" AS ENUM ('SPL', 'KQL', 'EQL', 'SIGMA');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('DRAFT', 'TESTING', 'VALIDATED');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('NOT_PRACTICED', 'OBSERVED', 'INVESTIGATED', 'DETECTION_CREATED', 'DETECTION_VALIDATED');

-- CreateTable
CREATE TABLE "AttackVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'enterprise-attack',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttackVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tactic" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stixId" TEXT NOT NULL,
    "shortname" TEXT NOT NULL,
    "attackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Tactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technique" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stixId" TEXT NOT NULL,
    "attackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "platforms" TEXT[],
    "detection" TEXT NOT NULL DEFAULT '',
    "dataSources" TEXT[],
    "isSubtechnique" BOOLEAN NOT NULL DEFAULT false,
    "parentAttackId" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Technique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechniqueTactic" (
    "techniqueId" TEXT NOT NULL,
    "tacticId" TEXT NOT NULL,

    CONSTRAINT "TechniqueTactic_pkey" PRIMARY KEY ("techniqueId","tacticId")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "siem" TEXT NOT NULL,
    "scenario" TEXT NOT NULL DEFAULT '',
    "dataSources" TEXT[],
    "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "status" "LabStatus" NOT NULL DEFAULT 'PLANNED',
    "tags" TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "labId" TEXT,
    "hypothesis" TEXT NOT NULL DEFAULT '',
    "objectives" TEXT NOT NULL DEFAULT '',
    "siem" TEXT NOT NULL DEFAULT '',
    "queriesRun" TEXT NOT NULL DEFAULT '',
    "findings" TEXT NOT NULL DEFAULT '',
    "conclusion" TEXT NOT NULL DEFAULT '',
    "lessons" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "raw" TEXT NOT NULL DEFAULT '',
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechniqueMapping" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "status" "MappingStatus" NOT NULL DEFAULT 'SUSPECTED',
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "rationale" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechniqueMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntingQuery" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" "QueryLang" NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "dataSources" TEXT[],
    "expectedResults" TEXT NOT NULL DEFAULT '',
    "falsePositives" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntingQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sigma" TEXT NOT NULL,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "logSource" TEXT NOT NULL DEFAULT '',
    "telemetry" TEXT NOT NULL DEFAULT '',
    "falsePositives" TEXT NOT NULL DEFAULT '',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "validation" "ValidationStatus" NOT NULL DEFAULT 'DRAFT',
    "references" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL DEFAULT '',
    "objectives" TEXT NOT NULL DEFAULT '',
    "telemetry" TEXT NOT NULL DEFAULT '',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "expectedFindings" TEXT NOT NULL DEFAULT '',
    "conclusionCriteria" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryTechnique" (
    "queryId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,

    CONSTRAINT "QueryTechnique_pkey" PRIMARY KEY ("queryId","techniqueId")
);

-- CreateTable
CREATE TABLE "RuleTechnique" (
    "ruleId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,

    CONSTRAINT "RuleTechnique_pkey" PRIMARY KEY ("ruleId","techniqueId")
);

-- CreateTable
CREATE TABLE "PlaybookTechnique" (
    "playbookId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,

    CONSTRAINT "PlaybookTechnique_pkey" PRIMARY KEY ("playbookId","techniqueId")
);

-- CreateTable
CREATE TABLE "PlaybookQuery" (
    "playbookId" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,

    CONSTRAINT "PlaybookQuery_pkey" PRIMARY KEY ("playbookId","queryId")
);

-- CreateTable
CREATE TABLE "CoverageOverride" (
    "techniqueId" TEXT NOT NULL,
    "status" "CoverageStatus" NOT NULL,

    CONSTRAINT "CoverageOverride_pkey" PRIMARY KEY ("techniqueId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttackVersion_version_key" ON "AttackVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Tactic_versionId_attackId_key" ON "Tactic"("versionId", "attackId");

-- CreateIndex
CREATE INDEX "Technique_attackId_idx" ON "Technique"("attackId");

-- CreateIndex
CREATE UNIQUE INDEX "Technique_versionId_attackId_key" ON "Technique"("versionId", "attackId");

-- CreateIndex
CREATE INDEX "Artifact_kind_value_idx" ON "Artifact"("kind", "value");

-- CreateIndex
CREATE INDEX "TechniqueMapping_techniqueId_status_idx" ON "TechniqueMapping"("techniqueId", "status");

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AttackVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technique" ADD CONSTRAINT "Technique_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AttackVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueTactic" ADD CONSTRAINT "TechniqueTactic_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueTactic" ADD CONSTRAINT "TechniqueTactic_tacticId_fkey" FOREIGN KEY ("tacticId") REFERENCES "Tactic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueMapping" ADD CONSTRAINT "TechniqueMapping_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueMapping" ADD CONSTRAINT "TechniqueMapping_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueMapping" ADD CONSTRAINT "TechniqueMapping_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryTechnique" ADD CONSTRAINT "QueryTechnique_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "HuntingQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryTechnique" ADD CONSTRAINT "QueryTechnique_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTechnique" ADD CONSTRAINT "RuleTechnique_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DetectionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTechnique" ADD CONSTRAINT "RuleTechnique_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookTechnique" ADD CONSTRAINT "PlaybookTechnique_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookTechnique" ADD CONSTRAINT "PlaybookTechnique_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookQuery" ADD CONSTRAINT "PlaybookQuery_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookQuery" ADD CONSTRAINT "PlaybookQuery_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "HuntingQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageOverride" ADD CONSTRAINT "CoverageOverride_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
