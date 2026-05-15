import type { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import {model} from "../../config/ai.js";
import  prisma  from "../../config/prisma.js";

// ─── Natural Language Search ──────────────────────────────────────────────────

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string (city or area mentioned)
- type: one of APARTMENT, HOUSE, ROOM, OTHER (pick the closest match)
- guests: number (max guests needed)
- maxPrice: number (maximum price per night in USD)

Type mapping rules:
- villa, mansion, cottage, chalet → HOUSE
- cabin, studio, loft → OTHER
- apartment, condo, flat → APARTMENT
- room, private room, shared → ROOM

Return ONLY valid JSON. No explanation. No markdown. Example:
{{"location": "Miami", "type": "HOUSE", "guests": 4, "maxPrice": 300}}

If a field is not mentioned, omit it from the JSON.
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
      location?: string;
      type?: string;
      guests?: number;
      maxPrice?: number;
    };

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