type ClassifyInput = {
  title: string;
  description: string;
};

export type ClassifyResult = {
  category: string;
  department: string;
  confidence: number;
};

const ROUTES: Array<{ keys: string[]; category: string; department: string }> = [
  {
    keys: ["pothole", "road", "street", "asphalt"],
    category: "Road Damage",
    department: "Public Works",
  },
  {
    keys: ["garbage", "waste", "trash", "dump"],
    category: "Sanitation",
    department: "Sanitation Department",
  },
  {
    keys: ["water leak", "pipe", "sewage", "drain"],
    category: "Water & Sewer",
    department: "Water Board",
  },
  {
    keys: ["light", "streetlight", "electric", "power"],
    category: "Electrical",
    department: "Electric Utility",
  },
];

export const classifyIssue = async (input: ClassifyInput): Promise<ClassifyResult> => {
  // Replace this fallback with TensorFlow Lite inference when model endpoint is ready.
  const text = `${input.title} ${input.description}`.toLowerCase();

  for (const route of ROUTES) {
    if (route.keys.some((key) => text.includes(key))) {
      return {
        category: route.category,
        department: route.department,
        confidence: 0.82,
      };
    }
  }

  return {
    category: "General Civic Issue",
    department: "Municipal Control Room",
    confidence: 0.55,
  };
};
