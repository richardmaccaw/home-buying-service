import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
  private readonly model;
  private static readonly TEMPLATE = `Extract comprehensive property information from the following Rightmove property listing content:

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
9. Listing date - look for "Added on DD/MM/YYYY" patterns in the content
10. Price reduction date - look for "Reduced on DD/MM/YYYY" patterns in the content

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
  "listing_date": "string (DD/MM/YYYY format)" | null,
  "price_reduction_date": "string (DD/MM/YYYY format)" | null,
  "images": ["string"] | null
}

Extract only the information that can be clearly determined from the content.`;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Extract property data from scraped content using Gemini AI
   */
  async extractPropertyData(content: string): Promise<any> {
    try {
      const prompt = AIService.TEMPLATE.replace("{content}", content);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return JSON.parse(text);
    } catch (error) {
      console.error('AI extraction error:', error);
      return this.extractBasicInfo(content);
    }
  }

  /**
   * Fallback method to extract basic information when AI extraction fails
   */
  private extractBasicInfo(content: string): any {
    const addressMatch = content.match(/Address:\s*(.+)/i);
    const imagesMatch = content.match(/Images:\s*(.+)/i);
    const priceMatch = content.match(/£([\d,]+)/);
    const sqftMatch = content.match(/(\d+[\s,]*)\s*sq\s*ft/i);
    const sqmMatch = content.match(/(\d+)\s*(sq\s*m|sqm)/i);
    
    // Specific patterns targeting Rightmove's structured format
    const bedroomsPatterns = [
      /BEDROOMS\s*\n?\s*(?:[^\d]*)?(\d+)/i,
      /BEDROOMS\s*:?\s*(\d+)/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten)\s+bedrooms?/i,
      /(\d+)\s+bedrooms?(?:\s|$|,|\.)/i,
      /bedrooms?\s*:?\s*(\d+)/i
    ];
    
    const bathroomsPatterns = [
      /BATHROOMS\s*\n?\s*(?:[^\d]*)?(\d+)/i,
      /BATHROOMS\s*:?\s*(\d+)/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten)\s+bathrooms?/i,
      /(\d+)\s+bathrooms?(?:\s|$|,|\.)/i,
      /bathrooms?\s*:?\s*(\d+)/i
    ];

    let bedroomsMatch = null;
    let bathroomsMatch = null;

    // Try each bedroom pattern
    for (const pattern of bedroomsPatterns) {
      bedroomsMatch = content.match(pattern);
      if (bedroomsMatch) break;
    }

    // Try each bathroom pattern  
    for (const pattern of bathroomsPatterns) {
      bathroomsMatch = content.match(pattern);
      if (bathroomsMatch) break;
    }

    // Convert word numbers to digits
    const wordToNumber: {[key: string]: number} = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    let bedrooms = null;
    let bathrooms = null;

    if (bedroomsMatch) {
      const value = bedroomsMatch[1].toLowerCase();
      bedrooms = wordToNumber[value] || parseInt(bedroomsMatch[1]);
      if (bedrooms < 1 || bedrooms > 20) bedrooms = null;
    }

    if (bathroomsMatch) {
      const value = bathroomsMatch[1].toLowerCase();
      bathrooms = wordToNumber[value] || parseInt(bathroomsMatch[1]);
      if (bathrooms < 1 || bathrooms > 15) bathrooms = null;
    }
    
    let sqm = null;
    if (sqmMatch) {
      sqm = parseInt(sqmMatch[1]);
    } else if (sqftMatch) {
      sqm = Math.round(parseInt(sqftMatch[1].replace(/,/g, '')) * 0.092903);
    }
    
    const images = imagesMatch ? imagesMatch[1].split(', ').map(url => url.trim()) : [];
    
    // Extract listing and price reduction dates
    const listingDateMatch = content.match(/Listing Date:\s*Added on (\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                            content.match(/Added on (\d{1,2}\/\d{1,2}\/\d{4})/i);
    const priceReductionMatch = content.match(/Price Reduction:\s*Reduced on (\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                               content.match(/Reduced on (\d{1,2}\/\d{1,2}\/\d{4})/i);

          return {
        address: addressMatch ? addressMatch[1].trim() : "Address extraction failed",
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null,
        square_meters: sqm,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        property_type: null,
        tenure: null,
        condition: null,
        listing_date: listingDateMatch ? listingDateMatch[1] : null,
        price_reduction_date: priceReductionMatch ? priceReductionMatch[1] : null,
        images: images
      };
  }
} 