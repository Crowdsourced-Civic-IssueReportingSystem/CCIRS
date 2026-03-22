/**
 * Firestore REST API Service
 * Uses REST calls instead of SDK to avoid npm install issues
 * Works with Firebase Cloud Functions seamlessly
 */

const fetchFn: typeof fetch = (...args) => fetch(...args);

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "crowdsourced-civic-issue-1f5fe";

interface Document {
  name: string;
  fields: any;
  createTime?: string;
  updateTime?: string;
}

interface QueryResult {
  documents?: Document[];
  message?: string;
}

const REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)`;

/**
 * Parse Firestore document to plain object
 */
function parseDoc(doc: Document): any {
  if (!doc.fields) return null;

  const obj: any = {};
  for (const [key, field] of Object.entries(doc.fields)) {
    obj[key] = parseField(field);
  }

  return obj;
}

/**
 * Parse Firestore field value
 */
function parseField(field: any): any {
  if (field.stringValue) return field.stringValue;
  if (field.integerValue) return parseInt(field.integerValue);
  if (field.doubleValue) return field.doubleValue;
  if (field.booleanValue) return field.booleanValue;
  if (field.timestampValue) return new Date(field.timestampValue);
  if (field.nullValue) return null;
  if (field.arrayValue) {
    return (field.arrayValue.values || []).map((v: any) => parseField(v));
  }
  if (field.mapValue) {
    return parseDoc({ fields: field.mapValue.fields } as Document);
  }
  return null;
}

/**
 * Convert value to Firestore field format
 */
function toField(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toField) } };
  }
  if (typeof value === "object") {
    const fields: any = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toField(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Create a document in Firestore
 */
export async function createDoc(
  collection: string,
  docId: string,
  data: any
): Promise<any> {
  const url = `${REST_BASE}/documents/${collection}/${docId}`;
  const fields = Object.entries(data).reduce((acc: any, [k, v]) => {
    acc[k] = toField(v);
    return acc;
  }, {});

  try {
    const response = await fetchFn(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as Document;
    return parseDoc(result);
  } catch (error) {
    console.error("createDoc error:", error);
    throw error;
  }
}

/**
 * Get a document from Firestore
 */
export async function getDoc(collection: string, docId: string): Promise<any> {
  const url = `${REST_BASE}/documents/${collection}/${docId}`;

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const doc = (await response.json()) as Document;
    return parseDoc(doc);
  } catch (error) {
    console.error("getDoc error:", error);
    throw error;
  }
}

/**
 * Update a document in Firestore
 */
export async function updateDoc(
  collection: string,
  docId: string,
  data: any
): Promise<any> {
  const url = `${REST_BASE}/documents/${collection}/${docId}`;
  const fields = Object.entries(data).reduce((acc: any, [k, v]) => {
    acc[k] = toField(v);
    return acc;
  }, {});

  try {
    const response = await fetchFn(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as Document;
    return parseDoc(result);
  } catch (error) {
    console.error("updateDoc error:", error);
    throw error;
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDoc(
  collection: string,
  docId: string
): Promise<void> {
  const url = `${REST_BASE}/documents/${collection}/${docId}`;

  try {
    const response = await fetchFn(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("deleteDoc error:", error);
    throw error;
  }
}

/**
 * Delete a subcollection document
 */
export async function deleteSubDoc(
  collection: string,
  docId: string,
  subCollection: string,
  subDocId: string
): Promise<void> {
  const url = `${REST_BASE}/documents/${collection}/${docId}/${subCollection}/${subDocId}`;

  try {
    const response = await fetchFn(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("deleteSubDoc error:", error);
    throw error;
  }
}

/**
 * Query documents from Firestore
 */
export async function queryDocs(
  collection: string,
  field: string,
  operator: string,
  value: any
): Promise<any[]> {
  const url = `${REST_BASE}/documents:query`;

  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection }],
          where: {
            fieldFilter: {
              field: { fieldPath: field },
              op: operator,
              value: toField(value),
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as QueryResult;
    return (result.documents || []).map(parseDoc);
  } catch (error) {
    console.error("queryDocs error:", error);
    throw error;
  }
}

/**
 * List all documents in a collection
 */
export async function listDocs(
  collection: string,
  pageSize: number = 100
): Promise<any[]> {
  const url = `${REST_BASE}/documents/${collection}?pageSize=${pageSize}`;

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as QueryResult;
    return (result.documents || []).map(parseDoc);
  } catch (error) {
    console.error("listDocs error:", error);
    throw error;
  }
}

/**
 * Create a subcollection document
 */
export async function createSubDoc(
  collection: string,
  docId: string,
  subCollection: string,
  subDocId: string,
  data: any
): Promise<any> {
  const url = `${REST_BASE}/documents/${collection}/${docId}/${subCollection}/${subDocId}`;
  const fields = Object.entries(data).reduce((acc: any, [k, v]) => {
    acc[k] = toField(v);
    return acc;
  }, {});

  try {
    const response = await fetchFn(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as Document;
    return parseDoc(result);
  } catch (error) {
    console.error("createSubDoc error:", error);
    throw error;
  }
}

/**
 * List subcollection documents
 */
export async function listSubDocs(
  collection: string,
  docId: string,
  subCollection: string
): Promise<any[]> {
  const url = `${REST_BASE}/documents/${collection}/${docId}/${subCollection}?pageSize=100`;

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as QueryResult;
    return (result.documents || []).map(parseDoc);
  } catch (error) {
    console.error("listSubDocs error:", error);
    throw error;
  }
}
