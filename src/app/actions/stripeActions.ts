"use server";

import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";
import { generateItineraryData } from "@/app/actions/generateTrip";
import { sendTripEmailAction } from "@/app/actions/sendTripEmail";

interface TripConfig {
  destination: string;
  days: string;
  budget: string;
  travelStyle: string;
  travelers: string;
  interests: string[];
  notes: string;
  startDate: string;
  userId: string;
}

export async function createCheckoutSessionAction(config: TripConfig, originUrl: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AI Trip Planner: ${config.destination}`,
              description: `Complete customized ${config.days}-day travel itinerary.`,
            },
            unit_amount: 199, // $1.99 USD
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${originUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl}`,
      metadata: {
        userId: config.userId,
        destination: config.destination,
        days: config.days,
        budget: config.budget,
        travelStyle: config.travelStyle,
        travelers: config.travelers,
        interests: JSON.stringify(config.interests),
        notes: config.notes.slice(0, 400),
        startDate: config.startDate || "",
      },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Failed to create Stripe Checkout session:", error);
    throw new Error(error.message || "Failed to create checkout session");
  }
}

export async function verifyPaymentAndGenerateTripAction(
  sessionId: string
): Promise<{ tripId?: string; error?: string }> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return { error: "Payment was not completed successfully." };
    }

    const meta = session.metadata;
    if (!meta) {
      return { error: "No trip metadata found in the session." };
    }

    const destination = meta.destination;
    const days = parseInt(meta.days, 10);
    const budget = meta.budget;
    const travelStyle = meta.travelStyle;
    const travelers = meta.travelers;
    const interests = JSON.parse(meta.interests) as string[];
    const notes = meta.notes;
    const startDate = meta.startDate;
    const userId = meta.userId;

    // Check if the trip was already generated (Admin SDK — bypasses Firestore rules)
    const tripDocRef = adminDb.collection("trips").doc(sessionId);
    const existingDoc = await tripDocRef.get();
    if (existingDoc.exists) {
      return { tripId: sessionId };
    }

    // Generate AI itinerary
    const aiResult = await generateItineraryData(
      destination,
      days,
      budget,
      travelStyle,
      interests,
      notes,
      startDate
    );

    // Save to Firestore using Admin SDK
    await tripDocRef.set({
      userId,
      destination,
      days,
      budget,
      travelStyle,
      interests,
      aiResult,
      startDate: startDate || null,
      createdAt: new Date().toISOString(),
    });

    const customerEmail = session.customer_details?.email;
    if (customerEmail) {
      sendTripEmailAction(customerEmail, sessionId, destination, aiResult).catch((err) => {
        console.error("Failed to send itinerary email in redirect flow:", err);
      });
    }

    return { tripId: sessionId };
  } catch (error: any) {
    console.error("TRIP GENERATION ERROR:", error);
    return { error: error.message || "Unknown error during trip generation" };
  }
}
