/**
 * Firestore REST API Service
 * Uses REST calls instead of SDK to avoid npm install issues
 * Works with Firebase Cloud Functions seamlessly
 */

const fetchFn: typeof fetch = (...args) => fetch(...args);

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "crowdsourced-civic-issue-1f5fe";
const USE_LOCAL_STORE = process.env.NODE_ENV !== "production";

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

const localCollections = new Map<string, Map<string, any>>();
const localSubCollections = new Map<string, Map<string, any>>();
let localSeeded = false;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getCollectionStore(collection: string): Map<string, any> {
  const existing = localCollections.get(collection);
  if (existing) return existing;

  const created = new Map<string, any>();
  localCollections.set(collection, created);
  return created;
}

function getSubCollectionStore(
  collection: string,
  docId: string,
  subCollection: string,
): Map<string, any> {
  const key = `${collection}/${docId}/${subCollection}`;
  const existing = localSubCollections.get(key);
  if (existing) return existing;

  const created = new Map<string, any>();
  localSubCollections.set(key, created);
  return created;
}

function ensureLocalSeeded(): void {
  if (localSeeded) return;

  const issueStore = getCollectionStore("issues");
  for (const issue of getMockData("issues")) {
    issueStore.set(issue.id, cloneValue(issue));
  }

  localSeeded = true;
}

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const doc = {
      id: docId,
      ...cloneValue(data),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    store.set(docId, doc);
    return cloneValue(doc);
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const doc = store.get(docId);
    return doc ? cloneValue(doc) : null;
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const previous = store.get(docId) || { id: docId };
    const merged = {
      ...cloneValue(previous),
      ...cloneValue(data),
      id: docId,
      updatedAt: new Date().toISOString(),
    };
    store.set(docId, merged);
    return cloneValue(merged);
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    store.delete(docId);

    const subPrefix = `${collection}/${docId}/`;
    for (const key of localSubCollections.keys()) {
      if (key.startsWith(subPrefix)) {
        localSubCollections.delete(key);
      }
    }
    return;
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getSubCollectionStore(collection, docId, subCollection);
    store.delete(subDocId);
    return;
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const allDocs = Array.from(store.values());

    const isEqualOp = operator === "EQUAL" || operator === "==" || operator === "EQUALS";
    if (!isEqualOp) {
      return [];
    }

    return allDocs.filter((doc) => doc[field] === value).map((doc) => cloneValue(doc));
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    return Array.from(store.values())
      .slice(0, pageSize)
      .map((doc) => cloneValue(doc));
  }

  const url = `${REST_BASE}/documents/${collection}?pageSize=${pageSize}`;

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // In dev mode, return mock data for 403 Forbidden (auth required)
      if (response.status === 403 && process.env.NODE_ENV !== "production") {
        console.warn(`Firestore auth not available in dev mode, returning mock data for ${collection}`);
        return getMockData(collection);
      }
      throw new Error(`Firestore error: ${response.statusText}`);
    }

    const result = (await response.json()) as QueryResult;
    return (result.documents || []).map(parseDoc);
  } catch (error) {
    console.error("listDocs error:", error);
    // Return mock data as fallback
    if (process.env.NODE_ENV !== "production") {
      return getMockData(collection);
    }
    throw error;
  }
}

/**
 * Get mock data for development/testing
 */
function getMockData(collection: string): any[] {
  if (collection === "issues") {
    return [
      {
        id: "issue_1",
        title: "Pothole on Main Street",
        description: "Large pothole affecting traffic safety on Main Street near 5th Avenue",
        status: "OPEN",
        severity: "HIGH",
        category: "infrastructure",
        department: "Public Works",
        aiConfidence: 0.95,
        latitude: 40.7128,
        longitude: -74.0060,
        address: "Main St & 5th Ave",
        voteCount: 12,
        commentCount: 3,
        createdBy: "demo_user",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "issue_2",
        title: "Broken streetlight",
        description: "Street light has been broken for two weeks. Safety hazard at night.",
        status: "IN_PROGRESS",
        severity: "MEDIUM",
        category: "lighting",
        department: "Parks & Recreation",
        aiConfidence: 0.87,
        latitude: 40.7150,
        longitude: -74.0080,
        address: "Park Ave & 10th St",
        voteCount: 8,
        commentCount: 2,
        createdBy: "demo_user2",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "issue_3",
        title: "Trash collection delay",
        description: "No trash collection for the past 5 days in Zone B",
        status: "RESOLVED",
        severity: "LOW",
        category: "sanitation",
        department: "Waste Management",
        aiConfidence: 0.92,
        latitude: 40.7200,
        longitude: -74.0100,
        address: "Zone B Downtown",
        voteCount: 5,
        commentCount: 1,
        createdBy: "demo_user3",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
  return [];
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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getSubCollectionStore(collection, docId, subCollection);
    const doc = {
      id: subDocId,
      ...cloneValue(data),
    };
    store.set(subDocId, doc);
    return cloneValue(doc);
  }

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
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getSubCollectionStore(collection, docId, subCollection);
    return Array.from(store.values()).map((doc) => cloneValue(doc));
  }

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
