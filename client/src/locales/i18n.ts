export type Language = "en" | "hi" | "as" | "mn" | "bn";

export interface Translations {
  appName: string;
  tagline: string;
  modules: {
    sanjit: string;
    sanjitSubtitle: string;
    praveen: string;
    praveenSubtitle: string;
    nish: string;
    nishSubtitle: string;
    architecture: string;
  };
  geofence: {
    title: string;
    safeZones: string;
    currentLocation: string;
    status: string;
    insideSafeZone: string;
    outsideSafeZone: string;
    breachAlert: string;
    startSimulation: string;
    pauseSimulation: string;
    resetRoute: string;
    simulateOscillation: string;
    batteryMode: string;
    highAccuracy: string;
    balanced: string;
    powerSaver: string;
    slidingWindowSummary: string;
  };
  sync: {
    title: string;
    queueStatus: string;
    pending: string;
    synced: string;
    flushNow: string;
    networkStatus: string;
    online: string;
    offline: string;
    simulateOffline: string;
    simulateOnline: string;
  };
  cognitive: {
    title: string;
    memoryTitle: string;
    attentionTitle: string;
    routineTitle: string;
    patternTitle: string;
    difficultyLevel: string;
    adaptiveEngineActive: string;
    score: string;
    accuracy: string;
    reactionTime: string;
    checkInMood: string;
    reminderTitle: string;
  };
  admin: {
    title: string;
    roster: string;
    scorecard: string;
    recordsAudit: string;
    alertCenter: string;
    orgAnalytics: string;
    gdprSecurity: string;
    consentActive: string;
    emergencyDispatch: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "Gurugale",
    tagline: "Empowering Dementia Care with Geofencing, Cognitive Therapy & Offline Sync",
    modules: {
      sanjit: "Sanjit: Geofence & Offline Sync",
      sanjitSubtitle: "Real-Time GPS Tracking, 5-Min Sliding Window Debounce & Offline Queue Engine",
      praveen: "Praveen: Cognitive Therapy",
      praveenSubtitle: "Adaptive Difficulty Lab, NER Cultural Games & Memory Matrix",
      nish: "Nischal: Clinical Admin Portal",
      nishSubtitle: "Central Ingestion Pipeline, Audit Trail & GDPR Compliance",
      architecture: "System Architecture",
    },
    geofence: {
      title: "Geofencing & GPS Telemetry Suite",
      safeZones: "Configured Safe Zones",
      currentLocation: "Patient Real-Time Location",
      status: "Perimeter Status",
      insideSafeZone: "INSIDE SAFE ZONE",
      outsideSafeZone: "SAFE ZONE BREACH DETECTED",
      breachAlert: "Immediate Attention: Perimeter boundary crossed!",
      startSimulation: "Walk Simulation",
      pauseSimulation: "Pause",
      resetRoute: "Reset Route",
      simulateOscillation: "Trigger Rapid Oscillation (Debounce Test)",
      batteryMode: "GPS Polling Mode",
      highAccuracy: "High Accuracy (1s)",
      balanced: "Balanced (5s)",
      powerSaver: "Power Saver (15s)",
      slidingWindowSummary: "5-Minute Sliding Window Debounce Active",
    },
    sync: {
      title: "Offline Sync Queue Engine",
      queueStatus: "Sync Queue Status",
      pending: "Pending Upload",
      synced: "Synced to Server",
      flushNow: "Flush Queue (POST /api/sync/batch)",
      networkStatus: "Network State",
      online: "ONLINE (Connected to Server)",
      offline: "OFFLINE (Queuing Locally)",
      simulateOffline: "Simulate Offline Mode",
      simulateOnline: "Restore Online Mode",
    },
    cognitive: {
      title: "Cognitive Therapy Lab",
      memoryTitle: "Visual Memory & Face-Name",
      attentionTitle: "Selective Attention & Focus",
      routineTitle: "Daily Routine Sequencing",
      patternTitle: "NER Cultural Pattern Recall",
      difficultyLevel: "Adaptive Level",
      adaptiveEngineActive: "Dynamic Difficulty Matrix Active",
      score: "Session Score",
      accuracy: "Accuracy",
      reactionTime: "Avg Reaction Time",
      checkInMood: "Post-Session Mood Check",
      reminderTitle: "Daily Living Reminders",
    },
    admin: {
      title: "Clinical Command & Ingestion Center",
      roster: "Patient Roster",
      scorecard: "Cognitive Scorecards",
      recordsAudit: "Versioned Medical Audit Log",
      alertCenter: "Deduplicated Alert Stream",
      orgAnalytics: "Ecosystem Analytics",
      gdprSecurity: "GDPR & Privacy Consent",
      consentActive: "GPS Telemetry Consent Granted",
      emergencyDispatch: "1-Click Caregiver Dispatch",
    },
  },
  hi: {
    appName: "गुरुगले",
    tagline: "जियोफेंसिंग, संज्ञानात्मक थेरेपी और ऑफलाइन सिंक के साथ डिमेंशिया देखभाल",
    modules: {
      sanjit: "संजीत: जियोफेंस और ऑफलाइन सिंक",
      sanjitSubtitle: "रीयल-टाइम जीपीएस, 5-मिनट स्लाइडिंग विंडो डिबाउंस और सिंक कतार",
      praveen: "प्रवीण: संज्ञानात्मक थेरेपी",
      praveenSubtitle: "अनुकूली कठिनाई लैब और पूर्वोत्तर सांस्कृतिक खेल",
      nish: "निश्चल: क्लिनिकल एडमिन पोर्टल",
      nishSubtitle: "केंद्रीय अंतर्ग्रहण पाइपलाइन और जीडीपीआर सुरक्षा",
      architecture: "सिस्टम आर्किटेक्चर",
    },
    geofence: {
      title: "जियोफेंसिंग और जीपीएस टेलीमेट्री सूट",
      safeZones: "सुरक्षित क्षेत्र (Safe Zones)",
      currentLocation: "मरीज की वर्तमान स्थिति",
      status: "परिधि स्थिति",
      insideSafeZone: "सुरक्षित क्षेत्र के अंदर",
      outsideSafeZone: "सुरक्षित क्षेत्र का उल्लंघन!",
      breachAlert: "चेतावनी: मरीज सुरक्षित सीमा से बाहर चला गया है!",
      startSimulation: "सिमुलेशन शुरू करें",
      pauseSimulation: "रोकें",
      resetRoute: "रूट रीसेट करें",
      simulateOscillation: "सीमा दोलन सिमुलेट करें (Debounce Test)",
      batteryMode: "जीपीएस पोलिंग मोड",
      highAccuracy: "उच्च सटीकता (1s)",
      balanced: "संतुलित (5s)",
      powerSaver: "बैटरी सेवर (15s)",
      slidingWindowSummary: "5-मिनट स्लाइडिंग विंडो सक्रिय",
    },
    sync: {
      title: "ऑफलाइन सिंक कतार इंजन",
      queueStatus: "सिंक स्थिति",
      pending: "लंबित अपलोड",
      synced: "सर्वर पर सिंक किया गया",
      flushNow: "अभी सिंक करें (POST /api/sync/batch)",
      networkStatus: "नेटवर्क स्थिति",
      online: "ऑनलाइन (सर्वर कनेक्टेड)",
      offline: "ऑफलाइन (स्थानीय स्टोरेज)",
      simulateOffline: "ऑफलाइन मोड चालू करें",
      simulateOnline: "ऑनलाइन मोड चालू करें",
    },
    cognitive: {
      title: "संज्ञानात्मक थेरेपी लैब",
      memoryTitle: "स्मृति अभ्यास",
      attentionTitle: "एकाग्रता और ध्यान",
      routineTitle: "दैनिक दिनचर्या क्रम",
      patternTitle: "पूर्वोत्तर सांस्कृतिक पैटर्न",
      difficultyLevel: "कठिनाई स्तर",
      adaptiveEngineActive: "अनुकूली नियम सक्रिय",
      score: "स्कोर",
      accuracy: "सटीकता",
      reactionTime: "प्रतिक्रिया समय",
      checkInMood: "मूड जांचें",
      reminderTitle: "दवा व दैनिक स्मरण",
    },
    admin: {
      title: "क्लिनिकल प्रबंधन केंद्र",
      roster: "मरीज सूची",
      scorecard: "संज्ञानात्मक स्कोरकार्ड",
      recordsAudit: "संस्करण मेडिकल ऑडिट",
      alertCenter: "अलर्ट केंद्र",
      orgAnalytics: "संगठन विश्लेषण",
      gdprSecurity: "जीडीपीआर व सहमति",
      consentActive: "जीपीएस ट्रैकिंग सहमति स्वीकृत",
      emergencyDispatch: "आपातकालीन देखभालकर्ता प्रेषण",
    },
  },
  as: {
    appName: "গুৰুগলে (Gurugale)",
    tagline: "ডিমেনচিয়া যত্ন, জিঅ'ফেন্সিং আৰু অফলাইন সিংকিং প্লেটফৰ্ম",
    modules: {
      sanjit: "সঞ্জীত: জিঅ'ফেন্স আৰু অফলাইন সিংক",
      sanjitSubtitle: "প্ৰকৃত সময়ৰ জিপিএছ, ৫ মিনিটৰ ডিবাউন্স আৰু সিংক ইঞ্জিন",
      praveen: "প্ৰবীণ: কগনিটিভ থেৰাপী",
      praveenSubtitle: "অসম আৰু উত্তৰ-পূবৰ সাংস্কৃতিক খেল আৰু স্মৃতি পৰীক্ষা",
      nish: "নিশ্চল: ক্লিনিকেল এডমিন প'ৰ্টেল",
      nishSubtitle: "কেন্দ্ৰীয় তথ্য গ্ৰহণ আৰু জিডিপিআৰ নিৰাপত্তা",
      architecture: "প্ৰণালী স্থাপত্য",
    },
    geofence: {
      title: "জিঅ'ফেন্সিং আৰু জিপিএছ পৰীক্ষা",
      safeZones: "সুৰক্ষিত মণ্ডল",
      currentLocation: "ৰোগীৰ বৰ্তমান স্থান",
      status: "অৱস্থা",
      insideSafeZone: "সুৰক্ষিত এলেকাৰ ভিতৰত",
      outsideSafeZone: "সুৰক্ষিত এলেকাৰ বাহিৰত!",
      breachAlert: "সতৰ্কবাণী: ৰোগীয়ে সুৰক্ষিত সীমা পাৰ কৰিছে!",
      startSimulation: "যাত্ৰা আৰম্ভ কৰক",
      pauseSimulation: "ৰখাওক",
      resetRoute: "পুনৰ সংহতি",
      simulateOscillation: "সীমা কম্পন পৰীক্ষা (Debounce)",
      batteryMode: "জিপিএছ ম'ড",
      highAccuracy: "উচ্চ সঠিকতা (1s)",
      balanced: "ভাৰসাম্য (5s)",
      powerSaver: "বেটাৰী ৰাহি (15s)",
      slidingWindowSummary: "৫ মিনিটৰ স্লাইডিং উইণ্ড' সক্ৰিয়",
    },
    sync: {
      title: "অফলাইন সিংক কিউ ইঞ্জিন",
      queueStatus: "সিংক অৱস্থা",
      pending: "জমাকৃত তথ্য",
      synced: "চাৰ্ভাৰত সংৰক্ষিত",
      flushNow: "এতিয়াই সিংক কৰক",
      networkStatus: "নেটৱৰ্ক স্থিতি",
      online: "অনলাইন (সংযুক্ত)",
      offline: "অফলাইন (স্থানীয়)",
      simulateOffline: "অফলাইন ম'ড",
      simulateOnline: "অনলাইন ম'ড",
    },
    cognitive: {
      title: "কগনিটিভ থেৰাপী লেব",
      memoryTitle: "স্মৃতি অনুশীলন (বিহু, জাপি)",
      attentionTitle: "মনোযোগ পৰীক্ষা",
      routineTitle: "দৈনন্দিন কামৰ ক্ৰম",
      patternTitle: "উত্তৰ-পূৰ্বাঞ্চলৰ সাংস্কৃতিক স্মৃতি",
      difficultyLevel: "স্তৰ",
      adaptiveEngineActive: "অভিযোজিত নিয়ম সক্ৰিয়",
      score: "স্ক'ৰ",
      accuracy: "সঠিকতা",
      reactionTime: "সঁহাৰিৰ সময়",
      checkInMood: "মনৰ ভাব পৰীক্ষা",
      reminderTitle: "দৈনিক সোঁৱৰণি",
    },
    admin: {
      title: "প্ৰশাসন আৰু তথ্য সংগ্ৰহ কেন্দ্ৰ",
      roster: "ৰোগীৰ তালিকা",
      scorecard: "স্বাস্থ্য ৰেখাচিত্ৰ",
      recordsAudit: "চিকিৎসা নথিৰ ইতিবৃত্ত",
      alertCenter: "সতৰ্কতা কেন্দ্ৰ",
      orgAnalytics: "সামগ্ৰিক বিশ্লেষণ",
      gdprSecurity: "গোপনীয়তা আৰু সম্মতি",
      consentActive: "জিপিএছ অনুসৰণ সন্মতি প্ৰদান কৰা হৈছে",
      emergencyDispatch: "জৰুৰী সহায় প্ৰেৰণ",
    },
  },
  mn: {
    appName: "গুরুগলে (Gurugale)",
    tagline: "লৈতেং ডিমেন্সিয়া লাইয়েং অমসুং জিওফেন্সিং প্লেটফর্ম",
    modules: {
      sanjit: "সংজিৎ: জিওফেন্স অমসুং অফলাইন সিংক",
      sanjitSubtitle: "জিপিএস ট্রেক তৌবা অমসুং ৫-মিনিট দিবাউন্স ইঞ্জিন",
      praveen: "প্রবীণ: কগনিটিভ থেরাপী",
      praveenSubtitle: "মণিপুরি লোকতাক অমসুং রাসলিলী কগনিটিভ সেন্তর",
      nish: "নিশ্চল: ক্লিনিক্যাল এদমিন পোর্তেল",
      nishSubtitle: "সেন্ত্রেল ইনজেসন অমসুং জিডিপিআর য়োকখৎপা",
      architecture: "সিস্তেম আর্কিতেকচর",
    },
    geofence: {
      title: "জিওফেন্সিং অমসুং জিপিএস সেন্তর",
      safeZones: "কনবা মফমশিং",
      currentLocation: "অনাবা মীওইগী হৌজিক লৈরিবা মফম",
      status: "ফীভম",
      insideSafeZone: "কনবা মফমগী মনুংদা",
      outsideSafeZone: "কনবা মফমগী মপান্দা লৈরে!",
      breachAlert: "চেকশিনবা: অনাবা মীওই অদু কনবা ঙমখৈ লানখ্রে!",
      startSimulation: "চৎপা হৌবা",
      pauseSimulation: "লেপপা",
      resetRoute: "অমুক হন্না হৌবা",
      simulateOscillation: "ঙমখৈ ওসিল্লেসন তেস্ত",
      batteryMode: "জিপিএস মোদ",
      highAccuracy: "হাই এক্যুরেসি (1s)",
      balanced: "বেলেন্সত (5s)",
      powerSaver: "বেক অপ (15s)",
      slidingWindowSummary: "৫-মিনিট স্লাইদিং ৱিন্দো এক্তিভ",
    },
    sync: {
      title: "অফলাইন সিংক কিউ ইঞ্জিন",
      queueStatus: "সিংক ফীভম",
      pending: "আপলোদ তৌদ্রিবা",
      synced: "সর্বারদা থমখ্রে",
      flushNow: "হৌজিক সিংক তৌবা",
      networkStatus: "নেতৱার্ক ফীভম",
      online: "অনলাইন",
      offline: "অফলাইন",
      simulateOffline: "অফলাইন তৌবা",
      simulateOnline: "অনলাইন তৌবা",
    },
    cognitive: {
      title: "কগনিটিভ থেরাপী লেব",
      memoryTitle: "মণিপুরি নীংশিংবা (লোকতাক, পেন্না)",
      attentionTitle: "পুন্সিদা মীৎয়েং থম্বা",
      routineTitle: "নোংমগী থবকশিং",
      patternTitle: "সংস্কৃতিগী মতৌশিং",
      difficultyLevel: "থাক",
      adaptiveEngineActive: "এদাপ্তিভ রুল এক্তিভ",
      score: "স্কোর",
      accuracy: "চুম্বা",
      reactionTime: "পাউখুম পীবগী মতম",
      checkInMood: "মীনুংশি য়েংবা",
      reminderTitle: "হীদাক নীংশিংবা",
    },
    admin: {
      title: "ক্লিনিক্যাল এদমিন সেন্তর",
      roster: "অনাবা মীওইগী মিংচেন",
      scorecard: "থেরাপী স্কোরকার্দ",
      recordsAudit: "অনাবা মীওইগী লাইয়েক ওদিত",
      alertCenter: "চেকশিনৱা সেন্তর",
      orgAnalytics: "সংগঠন এনালিতিক্স",
      gdprSecurity: "জিডিপিআর সেক্যুরিতি",
      consentActive: "জিপিএস ত্রেকিং কন্সেন্ত পীখ্রে",
      emergencyDispatch: "ইমর্জেন্সী কেয়ারগীভর খঙহনবা",
    },
  },
  bn: {
    appName: "গুরুগলে (Gurugale)",
    tagline: "ডিমেনশিয়া যত্ন, জিওফেন্সিং এবং অফলাইন সিঙ্ক প্ল্যাটফর্ম",
    modules: {
      sanjit: "সঞ্জিত: জিওফেন্স ও অফলাইন সিঙ্ক",
      sanjitSubtitle: "লাইভ জিপিএস ট্র্যাকিং, ৫-মিনিট ডিবাউন্স এবং অফলাইন কিউ ইঞ্জিন",
      praveen: "প্রবীণ: কগনিটিভ থেরাপি",
      praveenSubtitle: "অ্যাডাপটিভ ডিফিকাল্টি ল্যাব ও সাংস্কৃতিক মেমরি ম্যাট্রিক্স",
      nish: "নিশ্চল: ক্লিনিক্যাল অ্যাডমিন পোর্টাল",
      nishSubtitle: "সেন্ট্রাল ইনজেশন পাইপলাইন এবং জিডিপিআর সুরক্ষা",
      architecture: "সিস্টেম আর্কিটেকচার",
    },
    geofence: {
      title: "জিওফেন্সিং ও জিপিএস টেলিমেট্রি স্যুট",
      safeZones: "নিরাপদ অঞ্চল (Safe Zones)",
      currentLocation: "রোগীর বর্তমান অবস্থান",
      status: "সীমানা স্থিতি",
      insideSafeZone: "নিরাপদ অঞ্চলের ভিতরে",
      outsideSafeZone: "নিরাপদ অঞ্চলের বাইরে!",
      breachAlert: "সতর্কবার্তা: রোগী নিরাপদ সীমানা অতিক্রম করেছেন!",
      startSimulation: "সিমুলেশন শুরু",
      pauseSimulation: "বিরতি",
      resetRoute: "রুট রিসেট",
      simulateOscillation: "সীমানা দোলন সিমুলেট করুন (Debounce Test)",
      batteryMode: "জিপিএস পোলিং মোড",
      highAccuracy: "উচ্চ নির্ভুলতা (1s)",
      balanced: "ভারসাম্যপূর্ণ (5s)",
      powerSaver: "ব্যাটারি সেভার (15s)",
      slidingWindowSummary: "৫-মিনিট স্লাইডিং উইন্ডো সক্রিয়",
    },
    sync: {
      title: "অফলাইন সিঙ্ক কিউ ইঞ্জিন",
      queueStatus: "সিঙ্ক স্থিতি",
      pending: "অপেক্ষমান আপলোড",
      synced: "সার্ভারে সংরক্ষিত",
      flushNow: "এখনই সিঙ্ক করুন",
      networkStatus: "নেটওয়ার্ক স্থিতি",
      online: "অনলাইন (সংযুক্ত)",
      offline: "অফলাইন (স্থানীয় স্টোরেজ)",
      simulateOffline: "অফলাইন মোড",
      simulateOnline: "অনলাইন মোড",
    },
    cognitive: {
      title: "কগনিটিভ থেরাপি ল্যাব",
      memoryTitle: "স্মৃতি অনুশীলন",
      attentionTitle: "মনোযোগ পরীক্ষা",
      routineTitle: "দৈনন্দিন রুটিন ক্রম",
      patternTitle: "সাংস্কৃতিক নকশা সনাক্তকরণ",
      difficultyLevel: "কঠিনতা স্তর",
      adaptiveEngineActive: "অভিযোজিত নিয়ম সক্রিয়",
      score: "স্কোর",
      accuracy: "নির্ভুলতা",
      reactionTime: "প্রতিক্রিয়া সময়",
      checkInMood: "মেজাজ পরীক্ষা",
      reminderTitle: "দৈনিক অনুস্মারক",
    },
    admin: {
      title: "ক্লিনিক্যাল অ্যাডমিন সেন্টার",
      roster: "রোগীদের তালিকা",
      scorecard: "থেরাপি স্কোরকার্ড",
      recordsAudit: "মেডিকেল রেকর্ড অডিট",
      alertCenter: "সতর্কতা কেন্দ্র",
      orgAnalytics: "সংগঠন বিশ্লেষণ",
      gdprSecurity: "জিডিপিআর এবং সম্মতি",
      consentActive: "জিপিএস ট্র্যাকিং সম্মতি সক্রিয়",
      emergencyDispatch: "জরুরি সেবা প্রেরণ",
    },
  },
};
