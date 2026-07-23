import neo4j, { type Session } from "neo4j-driver";

import { medications } from "../lib/mock-data/medications";
import { patients } from "../lib/mock-data/patients";
import { populationData } from "../lib/mock-data/population";

const MULTI_WORD_DRUGS = [
  "Insulin glargine",
  "Vitamin D",
  "Folic acid",
  "Ferrous sulphate",
  "Calcium + Vitamin D",
  "Clenil Modulite",
  "Salbutamol inhaler",
  "Tiotropium",
];

function parseMedicationName(medLine: string): string {
  for (const prefix of MULTI_WORD_DRUGS) {
    if (medLine.toLowerCase().startsWith(prefix.toLowerCase())) return prefix;
  }
  return medLine.split(/\s+\d/)[0]?.trim() ?? medLine;
}

function getNeo4jConfig() {
  const uri = process.env.NEO4J_URI?.trim();
  const username = process.env.NEO4J_USERNAME?.trim();
  const password = process.env.NEO4J_PASSWORD?.trim();
  if (!uri || !username || !password) {
    throw new Error("NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD are required.");
  }
  return { uri, username, password };
}

async function ensureConstraints(session: Session) {
  const statements = [
    "CREATE CONSTRAINT patient_id IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT condition_name IF NOT EXISTS FOR (c:Condition) REQUIRE c.name IS UNIQUE",
    "CREATE CONSTRAINT medication_name IF NOT EXISTS FOR (m:Medication) REQUIRE m.name IS UNIQUE",
    "CREATE CONSTRAINT organization_name IF NOT EXISTS FOR (o:Organization) REQUIRE o.name IS UNIQUE",
    "CREATE CONSTRAINT imd_quintile IF NOT EXISTS FOR (i:ImdQuintile) REQUIRE i.quintile IS UNIQUE",
    "CREATE CONSTRAINT forecast_day IF NOT EXISTS FOR (f:AdmissionForecast) REQUIRE f.day IS UNIQUE",
    "CREATE CONSTRAINT equity_category IF NOT EXISTS FOR (e:EquityFlag) REQUIRE e.category IS UNIQUE",
  ];

  for (const statement of statements) {
    await session.run(statement);
  }
}

async function seedPatients(session: Session) {
  for (const patient of patients) {
    await session.run(
      `MERGE (p:Patient {id: $id})
       SET p.name = $name,
           p.nhsNumber = $nhsNumber,
           p.dob = $dob,
           p.age = $age,
           p.gender = $gender,
           p.postcode = $postcode,
           p.oracleScore = $oracleScore,
           p.oracleRisk = $oracleRisk,
           p.admissionRisk14Days = $admissionRisk14Days,
           p.riskFactors = $riskFactors,
           p.imdQuintile = $imdQuintile,
           p.icsRegion = $icsRegion,
           p.organisation = $organisation,
           p.bloodPressure = $bloodPressure,
           p.heartRate = $heartRate,
           p.temperature = $temperature,
           p.spo2 = $spo2,
           p.respiratoryRate = $respiratoryRate,
           p.vitalsRecordedAt = $vitalsRecordedAt`,
      {
        id: patient.id,
        name: patient.name,
        nhsNumber: patient.nhsNumber,
        dob: patient.dob,
        age: neo4j.int(patient.age),
        gender: patient.gender,
        postcode: patient.postcode,
        oracleScore: neo4j.int(patient.oracleScore),
        oracleRisk: patient.oracleRisk,
        admissionRisk14Days: neo4j.int(patient.digitalTwinPrediction.admissionRisk14Days),
        riskFactors: patient.digitalTwinPrediction.deteriorationSignals,
        imdQuintile: patient.imdQuintile ?? null,
        icsRegion: patient.icsRegion ?? null,
        organisation: patient.organisation ?? null,
        bloodPressure: patient.vitals?.bloodPressure ?? null,
        heartRate: patient.vitals ? neo4j.int(patient.vitals.heartRate) : null,
        temperature: patient.vitals?.temperature ?? null,
        spo2: patient.vitals ? neo4j.int(patient.vitals.spo2) : null,
        respiratoryRate: patient.vitals ? neo4j.int(patient.vitals.respiratoryRate) : null,
        vitalsRecordedAt: patient.vitals?.recordedAt ?? null,
      }
    );

    for (const condition of patient.activeConditions) {
      await session.run(
        `MERGE (c:Condition {name: $name})
         WITH c
         MATCH (p:Patient {id: $patientId})
         MERGE (p)-[:HAS_CONDITION]->(c)`,
        { name: condition, patientId: patient.id }
      );
    }

    const medNames = new Set(patient.activeMedications.map(parseMedicationName));
    if (patient.id === "P002") {
      medNames.add("Apixaban");
    }

    for (const medName of medNames) {
      await session.run(
        `MERGE (m:Medication {name: $name})
         WITH m
         MATCH (p:Patient {id: $patientId})
         MERGE (p)-[:TAKES_MEDICATION]->(m)`,
        { name: medName, patientId: patient.id }
      );
    }
  }
}

async function seedMedicationInteractions(session: Session) {
  for (const med of medications) {
    await session.run(
      `MERGE (m:Medication {name: $name})
       SET m.bnfSection = $bnfSection,
           m.dosing = $dosing`,
      { name: med.name, bnfSection: med.bnfSection, dosing: med.dosing }
    );

    for (const interaction of med.interactions) {
      await session.run(
        `MERGE (a:Medication {name: $drugA})
         MERGE (b:Medication {name: $drugB})
         MERGE (a)-[i:INTERACTS_WITH]->(b)
         SET i.severity = $severity,
             i.bnfRef = $bnfRef,
             i.recommendation = $recommendation`,
        {
          drugA: interaction.drugA,
          drugB: interaction.drugB,
          severity: interaction.severity,
          bnfRef: `BNF ${interaction.bnfSection}`,
          recommendation: interaction.recommendation,
        }
      );
    }
  }

  await session.run(
    `MERGE (a:Medication {name: 'Aspirin'})
     MERGE (b:Medication {name: 'Apixaban'})
     MERGE (a)-[i:INTERACTS_WITH]->(b)
     SET i.severity = 'High',
         i.bnfRef = 'BNF 2.9',
         i.recommendation = 'Additive bleeding risk. Review aspirin indication; consider apixaban monotherapy'`
  );
}

async function seedOrganizations(session: Session) {
  const { riskDistribution } = populationData;

  await session.run(
    `MERGE (ics:Organization {name: $name})
     SET ics.type = 'ICS',
         ics.totalPatients = $totalPatients,
         ics.practices = $practices,
         ics.aiActionsThisMonth = $aiActionsThisMonth,
         ics.synthesisApprovalRate = $synthesisApprovalRate,
         ics.guardianAlertsGenerated = $guardianAlertsGenerated,
         ics.equityFlags = $equityFlags,
         ics.riskLow = $riskLow,
         ics.riskMedium = $riskMedium,
         ics.riskHigh = $riskHigh,
         ics.riskVeryHigh = $riskVeryHigh`,
    {
      name: populationData.icsName,
      totalPatients: neo4j.int(populationData.totalPatients),
      practices: neo4j.int(populationData.practices),
      aiActionsThisMonth: neo4j.int(populationData.aiActionsThisMonth),
      synthesisApprovalRate: populationData.synthesisApprovalRate,
      guardianAlertsGenerated: neo4j.int(populationData.guardianAlertsGenerated),
      equityFlags: neo4j.int(populationData.equityFlags),
      riskLow: neo4j.int(riskDistribution.low),
      riskMedium: neo4j.int(riskDistribution.medium),
      riskHigh: neo4j.int(riskDistribution.high),
      riskVeryHigh: neo4j.int(riskDistribution.veryHigh),
    }
  );

  for (const practice of populationData.benchmarkByPractice) {
    await session.run(
      `MERGE (org:Organization {name: $name})
       SET org.type = 'Practice',
           org.listSize = $listSize,
           org.aiAdoption = $aiAdoption,
           org.queueClearance = $queueClearance,
           org.guardianAlerts = $guardianAlerts,
           org.equityFlags = $equityFlags,
           org.overallScore = $overallScore
       WITH org
       MATCH (ics:Organization {name: $icsName})
       MERGE (org)-[:REGISTERED_AT]->(ics)`,
      {
        name: practice.name,
        listSize: neo4j.int(practice.listSize),
        aiAdoption: neo4j.int(practice.aiAdoption),
        queueClearance: neo4j.int(practice.queueClearance),
        guardianAlerts: neo4j.int(practice.guardianAlerts),
        equityFlags: neo4j.int(practice.equityFlags),
        overallScore: neo4j.int(practice.overallScore),
        icsName: populationData.icsName,
      }
    );
  }

  await session.run(
    `MATCH (p:Patient)
     WITH p
     MATCH (org:Organization {name: 'Riverside Medical Centre'})
     MERGE (p)-[:REGISTERED_AT]->(org)`
  );
}

async function seedPopulationAggregates(session: Session) {
  for (const row of populationData.conditionPrevalenceByIMD) {
    await session.run(
      `MERGE (imd:ImdQuintile {quintile: $quintile})
       SET imd.t2d = $t2d,
           imd.hypertension = $hypertension,
           imd.copd = $copd,
           imd.depression = $depression`,
      row
    );
  }

  for (const row of populationData.admissionForecast) {
    await session.run(
      `MERGE (f:AdmissionForecast {day: $day})
       SET f.predicted = $predicted,
           f.historical = $historical,
           f.upper = $upper,
           f.lower = $lower`,
      {
        day: row.day,
        predicted: neo4j.int(row.predicted),
        historical: neo4j.int(row.historical),
        upper: neo4j.int(row.upper),
        lower: neo4j.int(row.lower),
      }
    );
  }

  for (const row of populationData.equityDeepDive) {
    await session.run(
      `MERGE (e:EquityFlag {category: $category})
       SET e.flagCount = $flagCount,
           e.practice = $practice,
           e.recommendedAction = $recommendedAction,
           e.status = $status`,
      {
        category: row.category,
        flagCount: neo4j.int(row.flagCount),
        practice: row.practice,
        recommendedAction: row.recommendedAction,
        status: row.status,
      }
    );
  }
}

async function run() {
  const { uri, username, password } = getNeo4jConfig();
  const database = process.env.NEO4J_DATABASE?.trim();
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session(database ? { database } : undefined);

  try {
    await ensureConstraints(session);
    await seedPatients(session);
    await seedMedicationInteractions(session);
    await seedOrganizations(session);
    await seedPopulationAggregates(session);

    const counts = await session.run(
      `MATCH (p:Patient) WITH count(p) AS patients
       MATCH (m:Medication) WITH patients, count(m) AS medications
       MATCH ()-[i:INTERACTS_WITH]->() WITH patients, medications, count(i) AS interactions
       MATCH (org:Organization {type: 'Practice'}) WITH patients, medications, interactions, count(org) AS practices
       RETURN patients, medications, interactions, practices`
    );

    const row = counts.records[0];
    console.log("Neo4j seed complete (idempotent MERGE):");
    console.log(`  Patients: ${row?.get("patients")}`);
    console.log(`  Medications: ${row?.get("medications")}`);
    console.log(`  INTERACTS_WITH edges: ${row?.get("interactions")}`);
    console.log(`  Practices: ${row?.get("practices")}`);

    const patel = await session.run(
      `MATCH (p:Patient {id: 'P002'})-[:TAKES_MEDICATION]->(m:Medication)
       OPTIONAL MATCH (m)-[i:INTERACTS_WITH]->(m2:Medication)
       WHERE EXISTS { MATCH (p)-[:TAKES_MEDICATION]->(m2) }
       RETURN collect(DISTINCT m.name) AS meds,
              collect(DISTINCT m.name + ' + ' + m2.name) AS interactions`
    );
    const patelRow = patel.records[0];
    console.log(`  Patel P002 medications: ${(patelRow?.get("meds") as string[]).join(", ")}`);
    console.log(`  Patel P002 interactions: ${(patelRow?.get("interactions") as string[]).filter(Boolean).join("; ") || "none"}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
