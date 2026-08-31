export interface CulturalItem {
  id: string;
  name: string;
  region: "Assam" | "Nagaland" | "Manipur" | "Meghalaya" | "National";
  category: "festival" | "artifact" | "wildlife" | "craft" | "nature";
  icon: string;
  description: string;
  hint: string;
}

export const NER_CULTURAL_ITEMS: CulturalItem[] = [
  {
    id: "ner-1",
    name: "Jaapi (জাপি)",
    region: "Assam",
    category: "artifact",
    icon: "👒",
    description: "Traditional conical bamboo hat with red-black felt patterns.",
    hint: "Worn during Rongali Bihu and presented as a token of honor.",
  },
  {
    id: "ner-2",
    name: "Bihu Dhol (বিহু ঢোল)",
    region: "Assam",
    category: "festival",
    icon: "🥁",
    description: "Double-headed barrel drum played during Assamese spring festivals.",
    hint: "Rhythmic heartbeat of Bihu dance performances.",
  },
  {
    id: "ner-3",
    name: "One-Horned Rhino (গঁড়)",
    region: "Assam",
    category: "wildlife",
    icon: "🦏",
    description: "Pride of Kaziranga National Park in the Brahmaputra valley.",
    hint: "Found grazing in the elephant grass of Kaziranga.",
  },
  {
    id: "ner-4",
    name: "Hornbill Feathers",
    region: "Nagaland",
    category: "festival",
    icon: "🪶",
    description: "Sacred bird celebrated at Kisama Heritage Village in December.",
    hint: "Festival of Festivals celebrated in Kohima.",
  },
  {
    id: "ner-5",
    name: "Naga Warrior Shawl",
    region: "Nagaland",
    category: "craft",
    icon: "🧣",
    description: "Hand-woven geometrical red, black, and white pattern textiles.",
    hint: "Woven by Lotha, Ao, and Angami master weavers.",
  },
  {
    id: "ner-6",
    name: "Loktak Phumdi (লোকতাক)",
    region: "Manipur",
    category: "nature",
    icon: "🏞️",
    description: "Floating biomass islands in the largest freshwater lake of Northeast India.",
    hint: "Home to the endangered Sangai dancing deer in Keibul Lamjao.",
  },
  {
    id: "ner-7",
    name: "Pena Fiddle (পেনা)",
    region: "Manipur",
    category: "craft",
    icon: "🎻",
    description: "Ancient single-string bowed lute made of coconut shell and bamboo.",
    hint: "Accompanies Lai Haraoba oral folk ballads.",
  },
  {
    id: "ner-8",
    name: "Living Root Bridge (Jingkieng Jri)",
    region: "Meghalaya",
    category: "nature",
    icon: "🌉",
    description: "Aerial bridges bio-engineered from living Ficus elastica tree roots.",
    hint: "Formed over centuries by the Khasi and Jaintia communities in Cherrapunji.",
  },
];
