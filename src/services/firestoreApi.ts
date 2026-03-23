import admin from "firebase-admin";

const USE_LOCAL_STORE = process.env.FIREBASE_USE_LOCAL_STORE === "1";

const localCollections = new Map<string, Map<string, any>>();
const localSubCollections = new Map<string, Map<string, any>>();
let localSeeded = false;
let cachedDb: FirebaseFirestore.Firestore | null = null;

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

function normalizeValue(value: any): any {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = normalizeValue(v);
    }
    return result;
  }

  return value;
}

function normalizeDoc(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): any {
  const data = snap.data();
  if (!data) return null;

  return {
    id: snap.id,
    ...normalizeValue(data),
  };
}

function getFirestore(): FirebaseFirestore.Firestore {
  if (cachedDb) return cachedDb;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!admin.apps.length) {
    let app: admin.app.App | null = null;
    let initialized = false;

    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
        app = admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId: parsed.projectId || projectId,
        });
        initialized = true;
      } catch (error) {
        console.warn(
          `Ignoring invalid FIREBASE_SERVICE_ACCOUNT_JSON; falling back to discrete credentials. ${String(error)}`,
        );
      }
    }

    if (!initialized && projectId && clientEmail && privateKey) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      initialized = true;
    }

    if (!initialized || !app) {
      app = admin.initializeApp({
        projectId,
      });
    }

    cachedDb = app.firestore();
  } else {
    cachedDb = admin.app().firestore();
  }

  return cachedDb;
}

export async function createDoc(
  collection: string,
  docId: string,
  data: any,
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

  const db = getFirestore();
  await db.collection(collection).doc(docId).set(data, { merge: true });
  return getDoc(collection, docId);
}

export async function getDoc(collection: string, docId: string): Promise<any> {
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const doc = store.get(docId);
    return doc ? cloneValue(doc) : null;
  }

  const db = getFirestore();
  const snap = await db.collection(collection).doc(docId).get();
  if (!snap.exists) return null;
  return normalizeDoc(snap);
}

export async function updateDoc(
  collection: string,
  docId: string,
  data: any,
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

  const db = getFirestore();
  await db.collection(collection).doc(docId).set(data, { merge: true });
  return getDoc(collection, docId);
}

export async function deleteDoc(collection: string, docId: string): Promise<void> {
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

  const db = getFirestore();
  await db.collection(collection).doc(docId).delete();
}

export async function deleteSubDoc(
  collection: string,
  docId: string,
  subCollection: string,
  subDocId: string,
): Promise<void> {
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getSubCollectionStore(collection, docId, subCollection);
    store.delete(subDocId);
    return;
  }

  const db = getFirestore();
  await db.collection(collection).doc(docId).collection(subCollection).doc(subDocId).delete();
}

function normalizeOperator(operator: string): FirebaseFirestore.WhereFilterOp {
  const op = operator.toUpperCase();
  if (op === "EQUAL" || op === "EQUALS" || operator === "==") return "==";
  if (operator === "!=") return "!=";
  if (operator === "<") return "<";
  if (operator === "<=") return "<=";
  if (operator === ">") return ">";
  if (operator === ">=") return ">=";
  if (op === "ARRAY_CONTAINS") return "array-contains";
  if (op === "IN") return "in";
  if (op === "NOT_IN") return "not-in";
  return "==";
}

export async function queryDocs(
  collection: string,
  field: string,
  operator: string,
  value: any,
): Promise<any[]> {
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    const allDocs = Array.from(store.values());
    const whereOp = normalizeOperator(operator);

    if (whereOp !== "==") {
      return [];
    }

    return allDocs.filter((doc) => doc[field] === value).map((doc) => cloneValue(doc));
  }

  const db = getFirestore();
  const whereOp = normalizeOperator(operator);
  const snap = await db.collection(collection).where(field, whereOp, value).get();
  return snap.docs.map((doc) => normalizeDoc(doc)).filter(Boolean);
}

export async function listDocs(collection: string, pageSize: number = 100): Promise<any[]> {
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getCollectionStore(collection);
    return Array.from(store.values())
      .slice(0, pageSize)
      .map((doc) => cloneValue(doc));
  }

  const db = getFirestore();
  const snap = await db.collection(collection).limit(pageSize).get();
  return snap.docs.map((doc) => normalizeDoc(doc)).filter(Boolean);
}

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
        longitude: -74.006,
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
        latitude: 40.715,
        longitude: -74.008,
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
        latitude: 40.72,
        longitude: -74.01,
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

export async function createSubDoc(
  collection: string,
  docId: string,
  subCollection: string,
  subDocId: string,
  data: any,
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

  const db = getFirestore();
  const ref = db.collection(collection).doc(docId).collection(subCollection).doc(subDocId);
  await ref.set(data, { merge: true });
  const snap = await ref.get();
  return normalizeDoc(snap);
}

export async function listSubDocs(
  collection: string,
  docId: string,
  subCollection: string,
): Promise<any[]> {
  if (USE_LOCAL_STORE) {
    ensureLocalSeeded();
    const store = getSubCollectionStore(collection, docId, subCollection);
    return Array.from(store.values()).map((doc) => cloneValue(doc));
  }

  const db = getFirestore();
  const snap = await db.collection(collection).doc(docId).collection(subCollection).limit(100).get();
  return snap.docs.map((doc) => normalizeDoc(doc)).filter(Boolean);
}
