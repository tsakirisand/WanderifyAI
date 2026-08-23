"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function updateTripAction(id: string, userId: string, aiResult: any) {
  if (!userId) throw new Error("Unauthorized");

  const tripDocRef = adminDb.collection("trips").doc(id);
  const tripDoc = await tripDocRef.get();
  if (!tripDoc.exists || tripDoc.data()?.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await tripDocRef.update({
    aiResult,
  });

  revalidatePath(`/trip/${id}`);
}

export async function updateTripCoordinates(id: string, coordinates: any) {
  try {
    const tripDocRef = adminDb.collection("trips").doc(id);
    await tripDocRef.update({
      coordinates,
    });
    revalidatePath(`/trip/${id}`);
  } catch (error) {
    console.error("Failed to update trip coordinates:", error);
  }
}
