import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  FirestoreError,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getDocument = async <T>(path: string, id: string): Promise<T | null> => {
  try {
    const docRef = doc(db, path, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
    return null;
  }
};

export const createDocument = async <T extends DocumentData>(path: string, id: string, data: T): Promise<void> => {
  try {
    const docRef = doc(db, path, id) as any;
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
};

export const updateDocument = async <T extends DocumentData>(path: string, id: string, data: Partial<T>): Promise<void> => {
  try {
    const docRef = doc(db, path, id) as any;
    await updateDoc(docRef, data as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
};

export const deleteDocument = async (path: string, id: string): Promise<void> => {
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};

export const getCollection = async <T>(path: string, ...queryConstraints: any[]): Promise<T[]> => {
  try {
    const colRef = collection(db, path);
    const q = query(colRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToCollection = <T>(
  path: string, 
  callback: (data: T[]) => void,
  ...queryConstraints: any[]
) => {
  const colRef = collection(db, path);
  const q = query(colRef, ...queryConstraints);
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    callback(snapshot.docs.map(doc => doc.data() as T));
  }, (error: FirestoreError) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToDocument = <T>(
  path: string,
  id: string,
  callback: (data: T | null) => void
) => {
  const docRef = doc(db, path, id);
  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as T) : null);
  }, (error: FirestoreError) => {
    handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
  });
};
