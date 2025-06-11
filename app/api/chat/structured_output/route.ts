import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PropertyDataSchema } from "@/lib/schemas/property";
import { scrapeRightmovePage, buildPropertyData } from "@/lib/rightmove";

export const runtime = "nodejs";

const TEMPLATE = `Extract comprehensive property information from the following Rightmove property listing content:

Property Content:
{content}

Please analyze the content and extract the following information:
1. Address - full property address (look for street name, area, postcode format like "Main Street, Tiddington, CV37")
2. Price - property price in GBP (numerical value only, no £ symbol)
3. Square meters - if only sq ft is available, convert to sq m (1 sq ft = 0.092903 sq m)
4. Bedrooms - number of bedrooms (look for patterns like "BEDROOMS: 2", "Two Bedrooms", "2 bedroom", "2 bed")
5. Bathrooms - number of bathrooms (look for patterns like "BATHROOMS: 2", "Two Bathrooms", "2 bathroom", "2 bath")
6. Property type - detached, semi-detached, terraced, flat, maisonette, bungalow, cottage, townhouse
7. Tenure - freehold, leasehold, shared-ownership, commonhold
8. Property condition - based on description: "ready-to-move", "renovation", "structural-project"

IMPORTANT EXTRACTION RULES:
- Extract only numerical values for price and measurements
- If only sq ft is provided, convert to sq m: multiply sq ft by 0.092903
- For property type, map common terms: "apartment" → "flat", "house" → based on description
- For condition, infer from description keywords like "modernised", "needs work", "refurbishment"
- Return null for any field that cannot be determined

Return the response in the following JSON format:
{
  "address": "string",
  "price": number,
  "square_meters": number | null,
  "bedrooms": number,
  "bathrooms": number,
  "property_type": "detached" | "semi-detached" | "terraced" | "flat" | "maisonette" | "bungalow" | "cottage" | "townhouse" | null,
  "tenure": "freehold" | "leasehold" | "shared-ownership" | "commonhold" | null,
  "condition": "ready-to-move" | "renovation" | "structural-project" | null,
  "images": ["string"] | null
}

Extract only the information that can be clearly determined from the content.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1].content;

    // Check if the input is a Rightmove URL
    if (!currentMessageContent.includes("rightmove.co.uk")) {
      return NextResponse.json(
        {
          error: "Please provide a valid Rightmove URL",
        },
        { status: 400 },
      );
    }

    // Scrape the Rightmove page
    const scrapedContent = await scrapeRightmovePage(currentMessageContent);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt with scraped content
    const prompt = TEMPLATE.replace("{content}", scrapedContent);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    let extractedData;
    try {
      extractedData = JSON.parse(text);

      // Ensure images is an array if it exists
      if (extractedData.images && !Array.isArray(extractedData.images)) {
        extractedData.images = [];
      }
    } catch (e) {
      // If parsing fails, try to extract basic information from scraped content
      const addressMatch = scrapedContent.match(/Address:\s*(.+)/i);
      const imagesMatch = scrapedContent.match(/Images:\s*(.+)/i);
      const priceMatch = scrapedContent.match(/£([\d,]+)/);
      const sqftMatch = scrapedContent.match(/(\d+[\s,]*)\s*sq\s*ft/i);
      const sqmMatch = scrapedContent.match(/(\d+)\s*(sq\s*m|sqm)/i);
      // Specific patterns targeting Rightmove's structured format
      const bedroomsPatterns = [
        /BEDROOMS\s*\n?\s*(?:[^\d]*)?(\d+)/i, // "BEDROOMS" followed by number (with possible icon/newline)
        /BEDROOMS\s*:?\s*(\d+)/i, // "BEDROOMS: 2" or "BEDROOMS 2"
        /(one|two|three|four|five|six|seven|eight|nine|ten)\s+bedrooms?/i, // "Two Bedrooms"
        /(\d+)\s+bedrooms?(?:\s|$|,|\.)/i, // "2 bedrooms" with word boundary
        /bedrooms?\s*:?\s*(\d+)/i, // "bedrooms: 2"
      ];

      const bathroomsPatterns = [
        /BATHROOMS\s*\n?\s*(?:[^\d]*)?(\d+)/i, // "BATHROOMS" followed by number (with possible icon/newline)
        /BATHROOMS\s*:?\s*(\d+)/i, // "BATHROOMS: 2" or "BATHROOMS 2"
        /(one|two|three|four|five|six|seven|eight|nine|ten)\s+bathrooms?/i, // "Two Bathrooms"
        /(\d+)\s+bathrooms?(?:\s|$|,|\.)/i, // "2 bathrooms" with word boundary
        /bathrooms?\s*:?\s*(\d+)/i, // "bathrooms: 2"
      ];

      let bedroomsMatch = null;
      let bathroomsMatch = null;

      // Try each bedroom pattern
      for (const pattern of bedroomsPatterns) {
        bedroomsMatch = scrapedContent.match(pattern);
        if (bedroomsMatch) break;
      }

      // Try each bathroom pattern
      for (const pattern of bathroomsPatterns) {
        bathroomsMatch = scrapedContent.match(pattern);
        if (bathroomsMatch) break;
      }

      // Convert word numbers to digits for bedrooms
      const wordToNumber: { [key: string]: number } = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
      };

      let bedrooms = null;
      let bathrooms = null;

      if (bedroomsMatch) {
        const value = bedroomsMatch[1].toLowerCase();
        // If it's a word, convert it to number, otherwise parse as integer
        if (wordToNumber[value]) {
          bedrooms = wordToNumber[value];
        } else {
          const numValue = parseInt(bedroomsMatch[1]);
          // Sanity check: bedrooms should be reasonable (1-20)
          if (numValue >= 1 && numValue <= 20) {
            bedrooms = numValue;
          }
        }
      }

      if (bathroomsMatch) {
        const value = bathroomsMatch[1].toLowerCase();
        // If it's a word, convert it to number, otherwise parse as integer
        if (wordToNumber[value]) {
          bathrooms = wordToNumber[value];
        } else {
          const numValue = parseInt(bathroomsMatch[1]);
          // Sanity check: bathrooms should be reasonable (1-15)
          if (numValue >= 1 && numValue <= 15) {
            bathrooms = numValue;
          }
        }
      }

      let sqm = null;
      if (sqmMatch) {
        sqm = parseInt(sqmMatch[1]);
      } else if (sqftMatch) {
        sqm = Math.round(parseInt(sqftMatch[1].replace(/,/g, "")) * 0.092903);
      }

      const images = imagesMatch
        ? imagesMatch[1].split(", ").map((url) => url.trim())
        : [];

      extractedData = {
        address: addressMatch
          ? addressMatch[1].trim()
          : "Address extraction failed",
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, "")) : null,
        square_meters: sqm,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        property_type: null,
        tenure: null,
        condition: null,
        images: images,
      };
    }

    // Build full PropertyData object
    const propertyData = buildPropertyData(extractedData);

    // Validate against schema
    const validatedData = PropertyDataSchema.parse(propertyData);

    return NextResponse.json(validatedData, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
