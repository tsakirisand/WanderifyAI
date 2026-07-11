"use server";

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function updateTripAction(id: string, userId: string, aiResult: any) {
  if (!userId) throw new Error("Unauthorized");

  const tripDocRef = doc(db, "trips", id);
  const tripDoc = await getDoc(tripDocRef);
  if (!tripDoc.exists() || tripDoc.data()?.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await updateDoc(tripDocRef, {
    aiResult,
  });

  revalidatePath(`/trip/${id}`);
}

export async function updateTripCoordinates(id: string, coordinates: any) {
  try {
    const tripDocRef = doc(db, "trips", id);
    await updateDoc(tripDocRef, {
      coordinates,
    });
    revalidatePath(`/trip/${id}`);
  } catch (error) {
    console.error("Failed to update trip coordinates:", error);
  }
}
