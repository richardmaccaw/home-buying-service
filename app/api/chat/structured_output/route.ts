import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from 'cheerio';
import { 
  PropertyDataSchema, 
  type PropertyData,
  type PropertyTenureType,
  type PropertyTypeType,
  type PropertyConditionType
} from '@/lib/schemas/property';

export const runtime = "nodejs";

/**
 * Scrapes a Rightmove page and extracts the HTML content
 */
async function scrapeRightmovePage(url: string): Promise<string> {
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/'
      }
    });
    
    if (!response.ok) {
      // If we get blocked, try to extract from the URL itself
      if (response.status === 403 || response.status === 429) {
        return extractFromUrlPattern(url);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract relevant content from the page
    let extractedText = '';
    
    // Rightmove-specific selectors for property details
    const priceSelectors = [
      'h1:contains("£")',
      '[data-testid="price"]',
      '.property-header-price',
      '.propertyHeaderPrice',
      'span:contains("£")',
      '.price',
      '.property-price',
      '[class*="price"]',
      'h1',
      'h2:contains("£")'
    ];
    
    const sizeSelectors = [
      '[data-testid="property-features"]',
      '.key-features',
      'li:contains("sq ft")',
      'li:contains("sq m")',
      'span:contains("sq ft")',
      'span:contains("sq m")',
      'div:contains("sq ft")',
      'div:contains("sq m")',
      '.property-features',
      '.property-description',
      '[class*="feature"]',
      '[class*="size"]',
      'li:contains("SIZE")',
      'div:contains("SIZE")'
    ];
    
    // Extract price information
    for (const selector of priceSelectors) {
      const priceElement = $(selector);
      if (priceElement.length > 0) {
        const priceText = priceElement.text().trim();
        if (priceText && priceText.includes('£')) {
          extractedText += `Price: ${priceText}\n`;
          break;
        }
      }
    }
    
    // Extract size/area information
    for (const selector of sizeSelectors) {
      const sizeElement = $(selector);
      if (sizeElement.length > 0) {
        const sizeText = sizeElement.text().trim();
        if (sizeText && (sizeText.includes('sq') || sizeText.includes('m²') || sizeText.includes('SIZE'))) {
          extractedText += `Size/Features: ${sizeText}\n`;
        }
      }
    }
    
    // Look for all elements containing price patterns
    $('*').each((_, element) => {
      const text = $(element).text();
      const priceMatch = text.match(/£[\d,]+/);
      if (priceMatch && !extractedText.includes('Price:')) {
        extractedText += `Found Price: ${priceMatch[0]}\n`;
      }
    });
    
    // Look for all elements containing sqm/sqft patterns
    $('*').each((_, element) => {
      const text = $(element).text();
      const sqftMatch = text.match(/\d+[\s,]*sq\s*ft/i);
      const sqmMatch = text.match(/\d+\s*(sq\s*m|sqm|m²|square\s*metre)/i);
      if (sqftMatch && !extractedText.includes('sq ft')) {
        extractedText += `Found Size (sq ft): ${sqftMatch[0]}\n`;
      }
      if (sqmMatch && !extractedText.includes('sq m')) {
        extractedText += `Found Size (sq m): ${sqmMatch[0]}\n`;
      }
    });
    
    // Also extract from meta tags
    $('meta[property="product:price:amount"]').each((_, el) => {
      extractedText += `Meta Price: £${$(el).attr('content')}\n`;
    });
    
    $('meta[name="description"]').each((_, el) => {
      const description = $(el).attr('content') || '';
      const priceMatch = description.match(/£[\d,]+/);
      const sqftMatch = description.match(/\d+[\s,]*sq\s*ft/i);
      const sqmMatch = description.match(/\d+\s*(sq\s*m|sqm|m²)/i);
      if (priceMatch) extractedText += `Meta Description Price: ${priceMatch[0]}\n`;
      if (sqftMatch) extractedText += `Meta Description Size (sq ft): ${sqftMatch[0]}\n`;
      if (sqmMatch) extractedText += `Meta Description Size (sq m): ${sqmMatch[0]}\n`;
    });
    
    // Extract from structured data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '');
        if (jsonData.offers && jsonData.offers.price) {
          extractedText += `Structured Price: £${jsonData.offers.price}\n`;
        }
        if (jsonData.floorSize || jsonData.size) {
          extractedText += `Structured Size: ${jsonData.floorSize || jsonData.size}\n`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    // Fallback: extract all text and look for patterns
    if (!extractedText.trim()) {
      const bodyText = $('body').text();
      const priceMatches = bodyText.match(/£[\d,]+/g);
      const sqftMatches = bodyText.match(/\d+[\s,]*sq\s*ft/gi);
      const sqmMatches = bodyText.match(/\d+\s*(sq\s*m|sqm|square\s*metres?|m²)/gi);
      
      if (priceMatches) {
        extractedText += `Found prices: ${priceMatches.slice(0, 5).join(', ')}\n`;
      }
      if (sqftMatches) {
        extractedText += `Found sizes (sq ft): ${sqftMatches.slice(0, 5).join(', ')}\n`;
      }
      if (sqmMatches) {
        extractedText += `Found sizes (sq m): ${sqmMatches.slice(0, 5).join(', ')}\n`;
      }
    }
    
    return extractedText || extractFromUrlPattern(url);
    
  } catch (error) {
    // Fallback to URL pattern extraction if scraping fails
    console.error('Scraping error:', error);
    return extractFromUrlPattern(url);
  }
}

/**
 * Fallback function to extract basic info from URL patterns when scraping fails
 */
function extractFromUrlPattern(url: string): string {
  // Rightmove URLs contain property IDs in the URL itself
  const urlPattern = /rightmove\.co\.uk\/properties\/(\d+)/;
  const match = url.match(urlPattern);
  
  if (match) {
    return `Property ID: ${match[1]}\nNote: Unable to scrape full details due to access restrictions. Please provide the property details manually or try a different URL.`;
  }
  
  return `URL: ${url}\nNote: Unable to access property details due to website restrictions. Please provide the square meters and price manually, or try accessing the page directly and copying the relevant information.`;
}

const TEMPLATE = `Extract comprehensive property information from the following Rightmove property listing content:

Property Content:
{content}

Please analyze the content and extract the following information:
1. Address - full property address
2. Price - property price in GBP (numerical value only, no £ symbol)
3. Square meters - if only sq ft is available, convert to sq m (1 sq ft = 0.092903 sq m)
4. Bedrooms - number of bedrooms
5. Bathrooms - number of bathrooms  
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
  "condition": "ready-to-move" | "renovation" | "structural-project" | null
}

Extract only the information that can be clearly determined from the content.`;

/**
 * Convert extracted data to full PropertyData schema with calculated/default values
 */
function buildPropertyData(extractedData: any): PropertyData {
  const now = new Date().toISOString();
  
  // Calculate price per sqm if we have both values
  const pricePerSqM = extractedData.square_meters && extractedData.price 
    ? Math.round(extractedData.price / extractedData.square_meters)
    : 10000; // Default estimate

  // Default values for fields we can't extract from scraping
  const propertyData: PropertyData = {
    address: extractedData.address || "Address not found",
    price: extractedData.price || 0,
    pricePerSqM: pricePerSqM,
    bedrooms: extractedData.bedrooms || 0,
    bathrooms: extractedData.bathrooms || 0,
    tenure: extractedData.tenure || "freehold",
    propertyType: extractedData.property_type || undefined,
    
    // Market metrics - estimated/default values
    marketTime: 30, // Default 30 days
    valueForMoney: 7.0, // Default score
    condition: extractedData.condition || "ready-to-move",
    
    // External valuations - use scraped price as base
    indices: {
      zoopla: extractedData.price || 0,
      ons: Math.round((extractedData.price || 0) * 0.98),
      acadata: Math.round((extractedData.price || 0) * 1.02),
    },
    
    // Historical data - placeholder
    history: {
      lastSalePrice: Math.round((extractedData.price || 0) * 0.8),
      lastSaleDate: "2020-01-01T10:00:00Z",
      growthSinceLastSale: 25.0,
      priceReductions: [],
    },
    
    // Market comparison data - placeholder
    listingDelta: {
      rightmove: 0,
      acadata: 0,
      listingDate: now,
    },
    
    // Local area insights - placeholder
    localArea: {
      onsAreaChange: 10.0,
      recentSales: [],
      postcodeAverage: {
        detached: Math.round((extractedData.price || 0) * 1.5),
        semiDetached: Math.round((extractedData.price || 0) * 1.2),
        terraced: extractedData.price || 0,
        flat: Math.round((extractedData.price || 0) * 0.8),
      },
      priceHistory: [
        {
          date: "2023-01-01T00:00:00Z",
          price: Math.round((extractedData.price || 0) * 0.9),
        },
      ],
    },
    
    // Financial information - calculated estimates
    costs: {
      sdlt: calculateSDLT(extractedData.price || 0),
      conveyancing: 1500,
      survey: 600,
    },
    
    // Mortgage data - calculated based on price
    mortgage: {
      monthlyPayments: calculateMortgagePayments(extractedData.price || 0),
    },
    
    // Metadata
    lastUpdated: now,
    dataSource: "rightmove-scraping",
    confidence: 0.7, // Lower confidence since many fields are estimated
  };

  return propertyData;
}

/**
 * Calculate SDLT based on property price
 */
function calculateSDLT(price: number): number {
  if (price <= 250000) return 0;
  if (price <= 925000) return (price - 250000) * 0.05;
  if (price <= 1500000) return 33750 + (price - 925000) * 0.1;
  return 91250 + (price - 1500000) * 0.12;
}

/**
 * Calculate mortgage payment options
 */
function calculateMortgagePayments(price: number): Array<{
  deposit: number;
  ltv: number;
  monthlyPayment: number;
  rate: number;
}> {
  const monthlyRate90 = 0.0525 / 12; // 5.25% annual
  const monthlyRate80 = 0.0495 / 12; // 4.95% annual
  const monthlyRate70 = 0.0465 / 12; // 4.65% annual
  const termMonths = 25 * 12; // 25 years

  return [
    {
      deposit: Math.round(price * 0.1),
      ltv: 90,
      monthlyPayment: Math.round(calculateMonthlyPayment(price * 0.9, monthlyRate90, termMonths)),
      rate: 5.25,
    },
    {
      deposit: Math.round(price * 0.2),
      ltv: 80,
      monthlyPayment: Math.round(calculateMonthlyPayment(price * 0.8, monthlyRate80, termMonths)),
      rate: 4.95,
    },
    {
      deposit: Math.round(price * 0.3),
      ltv: 70,
      monthlyPayment: Math.round(calculateMonthlyPayment(price * 0.7, monthlyRate70, termMonths)),
      rate: 4.65,
    },
  ];
}

/**
 * Calculate monthly mortgage payment
 */
function calculateMonthlyPayment(principal: number, monthlyRate: number, termMonths: number): number {
  if (monthlyRate === 0) return principal / termMonths;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

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
    } catch (e) {
      // If parsing fails, try to extract basic information from scraped content
      const priceMatch = scrapedContent.match(/£([\d,]+)/);
      const sqftMatch = scrapedContent.match(/(\d+[\s,]*)\s*sq\s*ft/i);
      const sqmMatch = scrapedContent.match(/(\d+)\s*(sq\s*m|sqm)/i);
      const bedroomsMatch = scrapedContent.match(/(\d+)\s*bedroom/i);
      const bathroomsMatch = scrapedContent.match(/(\d+)\s*bathroom/i);
      
      let sqm = null;
      if (sqmMatch) {
        sqm = parseInt(sqmMatch[1]);
      } else if (sqftMatch) {
        sqm = Math.round(parseInt(sqftMatch[1].replace(/,/g, '')) * 0.092903);
      }
      
      extractedData = {
        address: "Address extraction failed",
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null,
        square_meters: sqm,
        bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : null,
        bathrooms: bathroomsMatch ? parseInt(bathroomsMatch[1]) : null,
        property_type: null,
        tenure: null,
        condition: null
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

