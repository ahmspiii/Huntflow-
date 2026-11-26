import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting HuntFlow comprehensive seed by Ahmed Alaa...");

  // 1. Labs (Simulation Environments)
  const labBots = await db.lab.create({
    data: {
      name: "Splunk BOTS v3 (Boss of the SOC)",
      source: "Splunk BOTS",
      siem: "Splunk",
      scenario: "Full spectrum enterprise hunt: credential dumping, web defacement, lateral movement, and C2 beacons.",
      dataSources: ["Sysmon", "Windows Security", "Suricata", "Palo Alto", "DNS"],
      difficulty: "ADVANCED",
      status: "COMPLETED",
      tags: ["enterprise", "active-directory", "apt", "c2"],
      notes: "High fidelity hunting dataset provided by Splunk for forensic and detection validation.",
    },
  });

  const labTomcat = await db.lab.create({
    data: {
      name: "CyberDefenders: Tomcat Takeover",
      source: "CyberDefenders",
      siem: "Elastic SIEM",
      scenario: "Apache Tomcat manager endpoint brute-force leading to malicious WAR file upload and web shell deployment.",
      dataSources: ["Auditd", "Sysmon-Linux", "Tomcat Access Logs", "Packet Capture"],
      difficulty: "INTERMEDIATE",
      status: "COMPLETED",
      tags: ["linux", "web-application", "rce", "webshell"],
      notes: "Investigate web server logs and subsequent interactive bash execution.",
    },
  });

  const labEmotet = await db.lab.create({
    data: {
      name: "LetsDefend: Emotet Banking Trojan Triage",
      source: "LetsDefend",
      siem: "Microsoft Sentinel",
      scenario: "Phishing lure with malicious XLSM macro downloading secondary payload and establishing encrypted C2 channels.",
      dataSources: ["Defender for Endpoint", "DeviceNetworkEvents", "DeviceProcessEvents", "Office 365"],
      difficulty: "INTERMEDIATE",
      status: "IN_PROGRESS",
      tags: ["phishing", "macro", "dropper", "banking-trojan"],
      notes: "Sentinel workbook hunt for MS Office child process spawning PowerShell.",
    },
  });

  const labKerberos = await db.lab.create({
    data: {
      name: "Active Directory Kerberoasting & Golden Ticket",
      source: "Local Proxmox AD Lab",
      siem: "Splunk Enterprise",
      scenario: "Adversary abusing RC4 Kerberos service ticket requests (TGS-REQ) for service accounts with high privileges.",
      dataSources: ["Windows Security EID 4769", "Windows Security EID 4768", "Sysmon EID 1"],
      difficulty: "ADVANCED",
      status: "PLANNED",
      tags: ["active-directory", "kerberos", "credential-access"],
      notes: "Targeting SQL service SPNs with weak pre-auth passwords.",
    },
  });

  console.log("✅ Created 4 Labs");

  // 2. Investigations
  const invLsass = await db.investigation.create({
    data: {
      title: "LSASS Access & Memory Dump via Rundll32",
      labId: labBots.id,
      siem: "Splunk",
      hypothesis: "Adversary executed arbitrary code to open handles to lsass.exe to dump plaintext passwords and Kerberos tickets.",
      objectives: "Identify origin process, access mask (0x1010, 0x1fffff), and any dumped minidump files on disk.",
      queriesRun: `index=sysmon EventCode=10 TargetImage="*\\\\lsass.exe" GrantedAccess IN ("0x1010", "0x1410", "0x1fffff")
| stats count earliest(_time) as first_seen latest(_time) as last_seen by SourceImage, GrantedAccess, host`,
      findings: "rundll32.exe was observed calling OpenProcess on lsass.exe with full rights (0x1fffff). Memory dump written to C:\\Windows\\Temp\\lsass.dmp.",
      conclusion: "Confirmed credential dumping attempt by compromised admin account WKS-04\\jdoe.",
      lessons: "Enable Credential Guard on all Windows 11 endpoints and enforce Protected Process Light (PPL) for lsass.exe.",
    },
  });

  const invC2 = await db.investigation.create({
    data: {
      title: "Cobalt Strike HTTPS Beaconing & Named Pipe Injection",
      labId: labBots.id,
      siem: "Splunk",
      hypothesis: "Infected host is maintaining recurring C2 callback traffic over port 443 with randomized jitter.",
      objectives: "Extract destination C2 IP, SSL certificate anomalies, and internal named pipes used for lateral communication.",
      queriesRun: `index=suricata dest_port=443
| stats count, values(ssl.ja3) as ja3 by src_ip, dest_ip
| where count > 100`,
      findings: "Observed outbound connection to 185.220.101.5 on port 443 with self-signed certificate. Named pipe \\\\.\\pipe\\msagent_21 created.",
      conclusion: "Confirmed Cobalt Strike malleable C2 profile communicating with bulletproof hosting node.",
      lessons: "Implement TLS inspection on perimeter egress and block high-confidence AbuseIPDB/Tor nodes.",
    },
  });

  const invTomcat = await db.investigation.create({
    data: {
      title: "Tomcat Web Shell Upload & Remote Code Execution",
      labId: labTomcat.id,
      siem: "Elastic SIEM",
      hypothesis: "External attacker brute-forced /manager/html to deploy arbitrary WAR backdoor.",
      objectives: "Verify web access logs for 401 response spikes followed by 200 on /manager/html/upload.",
      queriesRun: `file.path: "/opt/tomcat/webapps/*" and event.action: "file-creation"`,
      findings: "Malicious archive cmd.war uploaded at 03:14 UTC. Spawned child process /bin/sh executing whoami and uname -a.",
      conclusion: "Server compromised due to default admin credentials (tomcat:s3cret).",
      lessons: "Restrict Tomcat Manager GUI to loopback interface and enforce MFA.",
    },
  });

  console.log("✅ Created 3 Investigations");

  // 3. Evidence & Artifacts
  const evLsass = await db.evidence.create({
    data: {
      investigationId: invLsass.id,
      title: "Sysmon EID 10 on WKS-04",
      source: "Sysmon Log Channel",
      description: "rundll32.exe accessed lsass.exe with PROCESS_ALL_ACCESS (0x1fffff).",
      collectedAt: new Date(),
    },
  });

  await db.artifact.createMany({
    data: [
      { evidenceId: evLsass.id, kind: "event_id", value: "10" },
      { evidenceId: evLsass.id, kind: "process", value: "rundll32.exe" },
      { evidenceId: evLsass.id, kind: "target", value: "lsass.exe" },
      { evidenceId: evLsass.id, kind: "hash", value: "44d88612fea8a8f36de82e1278abb02f" },
    ],
  });

  const evC2 = await db.evidence.create({
    data: {
      investigationId: invC2.id,
      title: "Suricata Flow Alert & Firewall Egress",
      source: "Palo Alto Firewall Logs",
      description: "Repeated beaconing traffic with 60s jitter towards external infrastructure.",
      collectedAt: new Date(),
    },
  });

  await db.artifact.createMany({
    data: [
      { evidenceId: evC2.id, kind: "ip", value: "185.220.101.5" },
      { evidenceId: evC2.id, kind: "domain", value: "berlin01.tor-exit.artikel10.org" },
      { evidenceId: evC2.id, kind: "port", value: "443" },
      { evidenceId: evC2.id, kind: "hash", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    ],
  });

  console.log("✅ Created Evidence & Artifacts");

  // 4. Malware Samples
  await db.malwareSample.create({
    data: {
      name: "Cobalt Strike HTTPS Beacon DLL",
      family: "Cobalt Strike",
      classification: "trojan",
      fileType: "PE32+ executable (DLL) x86-64",
      fileSize: 423936,
      source: "Incident Triage (WKS-04 Dump)",
      sha256: "44d88612fea8a8f36de82e1278abb02f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d",
      sha1: "8f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a",
      md5: "44d88612fea8a8f36de82e1278abb02f",
      packer: "Modified UPX / Custom XOR stub",
      c2Servers: ["185.220.101.5", "c2.threat-beacon.org"],
      droppedFiles: ["C:\\Windows\\Temp\\msagent.dll", "C:\\Users\\Public\\update.bat"],
      imports: "VirtualAlloc, VirtualProtect, CreateRemoteThread, HttpOpenRequestA, InternetConnectA",
      strings: "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n/api/v1/telemetry\n\\\\.\\pipe\\msagent_21\nCobaltStrike Beacon v4.8",
      registryChanges: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WindowsSecurityUpdate = C:\\Windows\\Temp\\rundll32.exe",
      networkActivity: "Periodic HTTPS GET/POST to 185.220.101.5 with 60s jitter and custom Base64 cookie encoding.",
      persistence: "Registry Run key pointing to rundll32 proxy execution.",
      tags: ["apt", "c2", "cobalt-strike", "dll-injection"],
      notes: "Sample extracted from WKS-04 memory during Incident Investigation. High confidence malicious verdict.",
      investigationId: invC2.id,
    },
  });

  await db.malwareSample.create({
    data: {
      name: "Emotet Epoch 5 Banking Dropper",
      family: "Emotet",
      classification: "dropper",
      fileType: "Microsoft Excel Document (.xlsm) with VBA",
      fileSize: 84920,
      source: "Phishing Gateway Quarantine",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      sha1: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
      md5: "d41d8cd98f00b204e9800998ecf8427e",
      packer: "VBA Stomping / Obfuscated Macro",
      c2Servers: ["194.87.139.12", "update.cdn-secure-office.com"],
      droppedFiles: ["%APPDATA%\\Local\\Microsoft\\Windows\\vault.exe"],
      imports: "URLDownloadToFileA, ShellExecuteA",
      strings: "powershell.exe -w hidden -enc JAB3AGMAPQBOAGUAdwAtAE8AYgBqAGUAYwB0AA==\nAuto_Open\nWorkbook_Open",
      networkActivity: "Downloads encrypted payload blob over HTTP port 8080 and writes PE executable.",
      persistence: "Scheduled Task named 'GoogleUpdateTaskMachineUA'",
      tags: ["emotet", "phishing", "macro", "dropper"],
      notes: "High impact initial access vector. Emotet payload designed to distribute ransomware payloads.",
    },
  });

  console.log("✅ Created 2 Malware Samples");

  // 5. Detection Rules (with Sigma and YARA)
  await db.detectionRule.create({
    data: {
      name: "LSASS Process Memory Handle Access",
      severity: "HIGH",
      validation: "VALIDATED",
      logSource: "windows_sysmon",
      telemetry: "Sysmon Event ID 10 (ProcessAccess)",
      falsePositives: "Endpoint protection agents (Defender, CrowdStrike, CarbonBlack)",
      sigma: `title: LSASS Memory Access by Suspicious Process
id: a8b3f120-410a-493e-908a-bc7f21503cb1
status: production
description: Detects process access to lsass.exe with high privilege access masks indicative of credential dumping
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\\lsass.exe'
        GrantedAccess|contains:
            - '0x1010'
            - '0x1410'
            - '0x1fffff'
    filter:
        SourceImage|endswith:
            - '\\MsMpEng.exe'
            - '\\csagent.exe'
    condition: selection and not filter
level: high`,
      yara: `rule Detect_LSASS_MemoryDump_String {
    meta:
        author = "Ahmed Alaa"
        description = "Detects strings related to LSASS minidump utilities"
    strings:
        $s1 = "lsass.dmp" ascii wide nocase
        $s2 = "MiniDumpWriteDump" ascii
        $s3 = "dbgcore.dll" ascii wide
    condition:
        2 of them
}`,
      references: ["https://attack.mitre.org/techniques/T1003/001/"],
    },
  });

  await db.detectionRule.create({
    data: {
      name: "PsExec Service Lateral Movement Installation",
      severity: "HIGH",
      validation: "VALIDATED",
      logSource: "windows_security",
      telemetry: "Windows Security Event ID 7045 / 4697",
      falsePositives: "Legitimate remote administrative scripts",
      sigma: `title: PsExec Remote Service Execution
id: c7e1f420-112a-412e-998a-aa7f21503cc2
status: production
description: Detects PsExec default service installation on remote Windows endpoints
logsource:
    product: windows
    service: system
detection:
    selection:
        EventID: 7045
        ServiceName|contains: 'PSEXESVC'
    condition: selection
level: high`,
      references: ["https://attack.mitre.org/techniques/T1569/002/"],
    },
  });

  console.log("✅ Created Detection Rules");

  // 6. Hunting Queries
  await db.huntingQuery.create({
    data: {
      title: "LSASS Handle Access Hunting (Splunk SPL)",
      language: "SPL",
      purpose: "Identify uncommon processes requesting read or all access to LSASS memory.",
      dataSources: ["Sysmon EID 10"],
      expectedResults: "Low volume hits primarily from administrative tools or malware.",
      falsePositives: "Antivirus, EDR, and backup agents.",
      content: `index=sysmon EventCode=10 TargetImage="*\\\\lsass.exe" GrantedAccess IN ("0x1010","0x1410","0x1fffff")
| stats count earliest(_time) as first_seen latest(_time) as last_seen by SourceImage, GrantedAccess, host, user
| sort - count`,
    },
  });

  await db.huntingQuery.create({
    data: {
      title: "Suspicious PowerShell Encoded Commands (KQL)",
      language: "KQL",
      purpose: "Hunt for base64 encoded PowerShell executions in Microsoft Sentinel.",
      dataSources: ["DeviceProcessEvents", "SecurityEvent"],
      expectedResults: "Encrypted script executions, dropper invocations.",
      falsePositives: "SCCM, Intune, or enterprise deployment scripts.",
      content: `DeviceProcessEvents
| where ProcessCommandLine has_any ("-enc", "-EncodedCommand", "-w hidden")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine, InitiatingProcessFileName
| order by Timestamp desc`,
    },
  });

  console.log("✅ Created Hunting Queries");

  // 7. MITRE Technique Mappings (Link to imported techniques if present)
  const tLsass = await db.technique.findFirst({ where: { attackId: "T1003.001" } });
  if (tLsass) {
    await db.techniqueMapping.create({
      data: {
        investigationId: invLsass.id,
        techniqueId: tLsass.id,
        evidenceId: evLsass.id,
        status: "CONFIRMED",
        confidence: 90,
        rationale: "Sysmon EID 10 confirms rundll32 requested full handle access to lsass.exe.",
      },
    });
  }

  const tC2 = await db.technique.findFirst({ where: { attackId: "T1071.001" } });
  if (tC2) {
    await db.techniqueMapping.create({
      data: {
        investigationId: invC2.id,
        techniqueId: tC2.id,
        evidenceId: evC2.id,
        status: "CONFIRMED",
        confidence: 85,
        rationale: "Suricata flow telemetry confirms HTTPS beaconing with periodic jitter.",
      },
    });
  }

  console.log("🚀 HuntFlow seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
