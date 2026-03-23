import { config } from "../config";

type ClassifyInput = {
  title: string;
  description: string;
};

export type ClassifyResult = {
  category: string;
  department: string;
  confidence: number;
  model: "external" | "fallback";
  predictedPriority: "LOW" | "MEDIUM" | "HIGH";
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
  const external = await classifyWithExternalModel(input);
  if (external) {
    return external;
  }
  return classifyWithFallback(input);
};

const classifyWithExternalModel = async (input: ClassifyInput): Promise<ClassifyResult | null> => {
  const endpoint = config.ai.classifierEndpoint;
  if (!endpoint) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.ai.classifierApiKey ? { Authorization: `Bearer ${config.ai.classifierApiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<ClassifyResult>;
    if (!payload.category || !payload.department) {
      return null;
    }

    return {
      category: payload.category,
      department: payload.department,
      confidence: typeof payload.confidence === "number" ? payload.confidence : 0.7,
      predictedPriority: normalizePriority(payload.predictedPriority),
      model: "external",
    };
  } catch {
    return null;
  }
};

const normalizePriority = (value: unknown): "LOW" | "MEDIUM" | "HIGH" => {
  const mapped = String(value || "MEDIUM").toUpperCase();
  if (mapped === "LOW" || mapped === "HIGH") return mapped;
  return "MEDIUM";
};

const classifyWithFallback = (input: ClassifyInput): ClassifyResult => {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const predictedPriority = predictPriority(text);

  for (const route of ROUTES) {
    if (route.keys.some((key) => text.includes(key))) {
      return {
        category: route.category,
        department: route.department,
        confidence: 0.82,
        model: "fallback",
        predictedPriority,
      };
    }
  }

  return {
    category: "General Civic Issue",
    department: "Municipal Control Room",
    confidence: 0.55,
    model: "fallback",
    predictedPriority,
  };
};

const predictPriority = (text: string): "LOW" | "MEDIUM" | "HIGH" => {
  const highSignals = ["accident", "injury", "danger", "fire", "live wire", "flood"];
  const lowSignals = ["cosmetic", "minor", "cleanup", "paint"];

  if (highSignals.some((signal) => text.includes(signal))) {
    return "HIGH";
  }

  if (lowSignals.some((signal) => text.includes(signal))) {
    return "LOW";
  }

  return "MEDIUM";
};
