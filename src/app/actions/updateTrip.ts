"use server";

import { adminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function updateTripAction(id: string, userId: string, aiResult: any) {
  if (!userId) throw new Error("Unauthorized");

  if (adminDb) {
    const ref = adminDb.collection("trips").doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ref.update({ aiResult });
  } else {
    const tripDocRef = doc(db, "trips", id);
    const tripDoc = await getDoc(tripDocRef);
    if (!tripDoc.exists() || tripDoc.data()?.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await updateDoc(tripDocRef, { aiResult });
  }

  revalidatePath(`/trip/${id}`);
}

export async function updateTripCoordinates(id: string, coordinates: any) {
  try {
    if (adminDb) {
      const ref = adminDb.collection("trips").doc(id);
      await ref.update({ coordinates });
    } else {
      const tripDocRef = doc(db, "trips", id);
      await updateDoc(tripDocRef, { coordinates });
    }
    revalidatePath(`/trip/${id}`);
  } catch (error) {
    console.error("Failed to update trip coordinates:", error);
  }
}

