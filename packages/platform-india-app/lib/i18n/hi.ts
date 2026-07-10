/** Hindi-first UI labels for Phase 0 clinical shell (English toggle in Phase 1). */
export const hi = {
  appName: "Aksh Health India",
  tagline: "समीक्षा-प्रथम क्लिनिकल दस्तावेज़ — ABDM-तैयार",
  nav: {
    home: "होम",
    intake: "इनटेक",
    review: "समीक्षा कतार"
  },
  proofNotice:
    "Phase 0: केवल सिंथेटिक डेटा। CDSCO/ABDM पंजीकरण पूर्ण नहीं। कोई लाइव PHI संग्रहीत नहीं।",
  home: {
    title: "क्लिनिकीय डैशबोर्ड (Phase 0)",
    subtitle: "Hindi-first GP review queue — Practo write-back के पहले मानव-समीक्षा अनिवार्य",
    safetyRef: "सुरक्षा संदर्भ: ICMR रोग मार्ग + Indian Pharmacopoeia DDI (NICE/BNF नहीं)"
  },
  intake: {
    title: "परामर्श इनटेक",
    subtitle: "हिंदी/अंग्रेज़ी ट्रांसक्रिप्ट → SOAP ड्राफ्ट (IndicBERT stub)",
    placeholder: "उदाहरण: मरीज़ को 3 दिन से खांसी और बुखार…",
    submit: "ड्राफ्ट बनाएँ"
  },
  review: {
    title: "समीक्षा कतार",
    subtitle: "क्लिनिशियन साइन-ऑफ के बाद ही Practo/HealthPlix write-back",
    columns: {
      patient: "मरीज़",
      summary: "सारांश",
      status: "स्थिति",
      safety: "सुरक्षा"
    },
    empty: "कोई केस लोड नहीं — सिंथेटिक फिक्स्चर जोड़ें"
  },
  gates: {
    pharmacopoeia: "Indian Pharmacopoeia DDI जाँच",
    icmr: "ICMR रोग मार्ग संकेत"
  }
} as const;

export type HiLabels = typeof hi;
