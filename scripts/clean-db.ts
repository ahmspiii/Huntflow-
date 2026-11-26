import { db } from "../src/lib/db";

async function clean() {
  console.log("🧹 Cleaning all demo and sample data from HuntFlow database...");

  // Delete join tables & dependent tables first (or cascade handles them)
  const deletedArtifacts = await db.artifact.deleteMany({});
  const deletedTimeline = await db.timelineEvent.deleteMany({});
  const deletedMappings = await db.techniqueMapping.deleteMany({});
  const deletedEvidence = await db.evidence.deleteMany({});

  const deletedSampleTech = await db.sampleTechnique.deleteMany({});
  const deletedMalware = await db.malwareSample.deleteMany({});

  const deletedRuleLogs = await db.ruleTestLog.deleteMany({});
  const deletedRuleTech = await db.ruleTechnique.deleteMany({});
  const deletedRules = await db.detectionRule.deleteMany({});

  const deletedPlaybookQueries = await db.playbookQuery.deleteMany({});
  const deletedPlaybookTech = await db.playbookTechnique.deleteMany({});
  const deletedPlaybooks = await db.playbook.deleteMany({});

  const deletedQueryTech = await db.queryTechnique.deleteMany({});
  const deletedQueries = await db.huntingQuery.deleteMany({});

  const deletedInvestigations = await db.investigation.deleteMany({});
  const deletedLabs = await db.lab.deleteMany({});

  console.log("✅ Removed:");
  console.log(`   - ${deletedLabs.count} Labs`);
  console.log(`   - ${deletedInvestigations.count} Investigations`);
  console.log(`   - ${deletedEvidence.count} Evidence records`);
  console.log(`   - ${deletedArtifacts.count} Artifacts/IOCs`);
  console.log(`   - ${deletedTimeline.count} Timeline events`);
  console.log(`   - ${deletedMappings.count} MITRE technique mappings`);
  console.log(`   - ${deletedMalware.count} Malware samples`);
  console.log(`   - ${deletedRules.count} Detection rules`);
  console.log(`   - ${deletedQueries.count} Hunting queries`);
  console.log(`   - ${deletedPlaybooks.count} Playbooks`);
  console.log("\n✨ Database is now a clean template! Ready for your real hunts and data.");
}

clean()
  .catch((e) => {
    console.error("❌ Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
