import type { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import {model} from "../../config/ai.js";
import  prisma  from "../../config/prisma.js";

// ─── Natural Language Search ──────────────────────────────────────────────────

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a property search assistant for an accommodation booking platform.
Your sole purpose is to help customers find available properties to rent or stay in.

User query: {query}

First decide: is this query about finding accommodation, a property, a house, an apartment, a room, or a place to stay?

If NO — the query is about something unrelated (food, weather, people, events, general questions, anything not about renting a place) — return exactly this and nothing else:
{{"offTopic": true}}

If YES — extract search filters and return a JSON object with only the fields that apply:
- location: string (city, area, or neighborhood mentioned)
- type: one of APARTMENT, HOUSE, ROOM, OTHER
- guests: number (number of people or guests)
- maxPrice: number (maximum price per night in USD)
- amenities: array of strings chosen strictly from the list below

Available amenities — use exact spelling from this list only:
WiFi, Pool, TV, Parking, Kitchen, Air conditioning, Gym, Washer, Balcony, Beach access, Pet friendly, Breakfast included

Amenity keyword mapping:
- beach, sea, ocean, coastal, seaside, waterfront → Beach access
- tv, television, screen, netflix, streaming → TV
- swim, swimming, pool → Pool
- wifi, internet, wireless, broadband → WiFi
- parking, garage, car space, driveway → Parking
- gym, fitness, workout, exercise → Gym
- kitchen, cooking, kitchenette, cook → Kitchen
- ac, air con, air conditioning, cooling, climate → Air conditioning
- washer, washing machine, laundry, dryer → Washer
- balcony, terrace, patio, deck → Balcony
- pets, dog, cat, animal → Pet friendly
- breakfast, morning meal, meals → Breakfast included

Type mapping:
- villa, mansion, cottage, chalet, bungalow → HOUSE
- cabin, studio, loft → OTHER
- apartment, condo, flat, penthouse → APARTMENT
- room, private room, shared room, bed → ROOM

Return ONLY valid JSON. No explanation. No markdown. No extra text.
Example: {{"location": "Paris", "type": "APARTMENT", "guests": 2, "maxPrice": 150, "amenities": ["WiFi", "Pool"]}}

Omit any field that is not mentioned in the query.
`);

const parser = new JsonOutputParser();

const searchChain = searchPrompt.pipe(model).pipe(parser);

// Fallback map so the model can never return an invalid type
const TYPE_MAP: Record<string, string> = {
  VILLA: "HOUSE", CABIN: "OTHER", MANSION: "HOUSE",
  COTTAGE: "HOUSE", CHALET: "HOUSE", STUDIO: "OTHER", LOFT: "OTHER",
};

export async function naturalLanguageSearch(req: Request, res: Response) {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    const filters = await searchChain.invoke({ query }) as {
      offTopic?: boolean;
      location?: string;
      type?: string;
      guests?: number;
      maxPrice?: number;
      amenities?: string[];
    };

    // Query is not related to accommodation — return a clean response
    if (filters.offTopic) {
      return res.json({
        query,
        offTopic: true,
        message: "No results found. Please search for a property, house, apartment, or room to stay in.",
        extractedFilters: {},
        results: [],
        count: 0,
      });
    }

    const where: Record<string, unknown> = { status: "APPROVED" };

    if (filters.location) {
      where["location"] = { contains: filters.location, mode: "insensitive" };
    }
    if (filters.type) {
      const t = filters.type.toUpperCase();
      where["type"] = TYPE_MAP[t] ?? t;
    }
    if (filters.guests) {
      where["guests"] = { gte: filters.guests };
    }
    if (filters.maxPrice) {
      where["price"] = { lte: filters.maxPrice };
    }
    if (filters.amenities && filters.amenities.length > 0) {
      where["amenities"] = { hasSome: filters.amenities };
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        host:   { select: { id: true, name: true, email: true } },
        photos: { select: { id: true, url: true, publicId: true } },
        review: { select: { rating: true } },
        booking: {
          where:  { status: "CONFIRMED", checkOut: { gte: new Date() } },
          select: { id: true },
          take:   1,
        },
      },
      take: 20,
    });

    res.json({ query, extractedFilters: filters, results: listings, count: listings.length });
  } catch (err) {
    console.error("AI search error:", err);
    res.status(500).json({ error: "AI search failed. Please try again." });
  }
}

// ─── Listing Description Generator ───────────────────────────────────────────

const descriptionPrompt = ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.
Write an engaging, warm, and descriptive listing description.

Listing details:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: ${"{price}"} USD

Write a 3-paragraph description:
1. Opening hook — what makes this place special
2. The space — describe the property and its features
3. The location — what guests can do nearby

Keep it between 150-200 words. Be specific and inviting. Do not use generic phrases like "perfect getaway".
`);

const descriptionChain = descriptionPrompt.pipe(model).pipe(new StringOutputParser());

export async function generateListingDescription(req: Request, res: Response) {
  const { title, location, type, guests, amenities, price } = req.body;

  if (!title || !location || !type || !guests || !amenities || !price) {
    return res.status(400).json({ error: "title, location, type, guests, amenities, and price are required" });
  }

  try {
    const description = await descriptionChain.invoke({
      title,
      location,
      type,
      guests,
      amenities: Array.isArray(amenities) ? amenities.join(", ") : amenities,
      price,
    });

    res.json({ description });
  } catch (err) {
    console.error("AI description error:", err);
    res.status(500).json({ error: "Description generation failed. Please try again." });
  }
}