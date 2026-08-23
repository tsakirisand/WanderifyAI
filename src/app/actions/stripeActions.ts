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

export async function createCheckoutSessionAction(
  config: TripConfig,
  originUrl: string
): Promise<{ url?: string | null; error?: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe secret key is not configured on the server." };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
    });

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
    return { error: error.message || "Failed to create checkout session" };
  }
}

export async function verifyPaymentAndGenerateTripAction(
  sessionId: string
): Promise<{ tripId?: string; error?: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe secret key is not configured on the server." };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
    });

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

    // Check if the trip was already generated or is generating
    const tripDocRef = adminDb.collection("trips").doc(sessionId);
    let existingDoc = await tripDocRef.get();
    
    // If doc exists and has aiResult, return immediately
    if (existingDoc.exists && existingDoc.data()?.aiResult) {
      return { tripId: sessionId };
    }

    // If another process is currently generating, wait up to 15 seconds for completion
    if (existingDoc.exists && existingDoc.data()?.isGenerating) {
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        existingDoc = await tripDocRef.get();
        if (existingDoc.exists && existingDoc.data()?.aiResult) {
          return { tripId: sessionId };
        }
      }
    }

    // Set lock flag to prevent duplicate parallel AI generation calls
    await tripDocRef.set(
      { isGenerating: true, createdAt: new Date().toISOString() },
      { merge: true }
    );

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
      isGenerating: false,
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
