"use server";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function getUserTrips(userId: string) {
  if (!userId) throw new Error("Unauthorized");

  const q = query(collection(db, "trips"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const trips = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));

  // Sort by createdAt descending in JS to avoid needing a composite index
  trips.sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return trips as any[];
}

export async function getTripById(id: string, userId: string) {
  if (!userId) throw new Error("Unauthorized");

  const tripDocRef = doc(db, "trips", id);
  const tripDoc = await getDoc(tripDocRef);
  
  if (!tripDoc.exists()) return null;
  const data = tripDoc.data();
  if (data?.userId !== userId) return null;

  return { id: tripDoc.id, ...data } as any;
}

export async function deleteTrip(id: string, userId: string) {
  if (!userId) throw new Error("Unauthorized");

  const tripDocRef = doc(db, "trips", id);
  const tripDoc = await getDoc(tripDocRef);
  if (tripDoc.exists() && tripDoc.data()?.userId === userId) {
    await deleteDoc(tripDocRef);
  }

  revalidatePath("/dashboard");
}
