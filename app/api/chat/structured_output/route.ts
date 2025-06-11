import { NextRequest, NextResponse } from "next/server";
import { ScrapingService } from "@/lib/services/scraping.service";
import { PropertyDataService } from "@/lib/services/property-data.service";
import { AIService } from "@/lib/services/ai.service";

export const runtime = "nodejs";

/**
 * This handler scrapes Rightmove pages and uses Google's Gemini API to extract comprehensive property details.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1].content;

    // Check if the input is a Rightmove URL
    if (!currentMessageContent.includes('rightmove.co.uk')) {
      return NextResponse.json({ 
        error: "Please provide a valid Rightmove URL" 
      }, { status: 400 });
    }

    // Initialize services
    const scrapingService = new ScrapingService();
    const aiService = new AIService(process.env.GOOGLE_API_KEY!);
    const propertyDataService = new PropertyDataService();

    // Scrape the Rightmove page
    const scrapedContent = await scrapingService.scrapeRightmovePage(currentMessageContent);

    // Extract property data using AI
    const extractedData = await aiService.extractPropertyData(scrapedContent);

    // Build and validate full PropertyData object
    const propertyData = propertyDataService.buildPropertyData(extractedData);
    const validatedData = propertyDataService.validatePropertyData(propertyData);

    return NextResponse.json(validatedData, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

