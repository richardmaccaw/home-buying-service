import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from 'cheerio';

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

const TEMPLATE = `Extract the square meters and price from the following Rightmove property listing content:

Property Content:
{content}

Please analyze the content and extract the following information:
1. Square meters (sqm) of the property - look for patterns like "123 sq m", "123 sqm", "123 square metres". Note: If only sq ft is available, convert to sq m (1 sq ft = 0.092903 sq m)
2. Price of the property in GBP - look for patterns like "£123,456" or "£123456"

IMPORTANT EXTRACTION RULES:
- For price: Extract only the numerical value without £ symbol and commas. For example, "£450,000" should become 450000
- For square meters: Extract only the numerical value. For example, "120 sq m" should become 120
- If only sq ft is provided, convert to sq m: multiply sq ft by 0.092903
- If multiple prices are found, choose the main asking price (usually the largest amount)
- If multiple sizes are found, choose the total floor area (usually the largest value)
- Return null if the information cannot be found

Return the response in the following JSON format:
{
  "square_meters": number | null,
  "price": number | null


Extract only numerical values as specified above.`;

/**
 * This handler scrapes Rightmove pages and uses Google's Gemini API to extract property details.
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
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (e) {
      // If parsing fails, try to extract numbers from the text
      const squareMetersMatch = text.match(/square_meters["\s:]+(\d+)/i) || 
                               scrapedContent.match(/(\d+)\s*(sq\s*m|sqm|square\s*metres?)/i) ||
                               scrapedContent.match(/(\d+[\s,]*)\s*sq\s*ft/i);
      const priceMatch = text.match(/price["\s:]+(\d+)/i) || 
                        scrapedContent.match(/£([\d,]+)/);
      
      let sqm = null;
      if (squareMetersMatch) {
        let value = parseInt(squareMetersMatch[1].replace(/,/g, ''));
        // If it's sq ft, convert to sq m
        if (scrapedContent.includes('sq ft') && !scrapedContent.includes('sq m')) {
          value = Math.round(value * 0.092903);
        }
        sqm = value;
      }
      
      parsedResponse = {
        square_meters: sqm,
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null
      };
    }

    // Validate the response against our schema
    const schema = z.object({
      square_meters: z.number().nullable(),
      price: z.number().nullable()
    });

    const validatedResponse = schema.parse(parsedResponse);

    return NextResponse.json(validatedResponse, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

