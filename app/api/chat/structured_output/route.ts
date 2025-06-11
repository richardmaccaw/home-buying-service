import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";
import {
  PropertyDataSchema,
  type PropertyData,
  type PropertyTenureType,
  type PropertyTypeType,
  type PropertyConditionType,
} from "@/lib/schemas/property";

export const runtime = "nodejs";

/**
 * Scrapes a Rightmove page and extracts the HTML content
 */
async function scrapeRightmovePage(url: string): Promise<string> {
  try {
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        Referer: "https://www.google.com/",
      },
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
    let extractedText = "";

    // Rightmove-specific selectors for property details
    const priceSelectors = [
      'h1:contains("£")',
      '[data-testid="price"]',
      ".property-header-price",
      ".propertyHeaderPrice",
      'span:contains("£")',
      ".price",
      ".property-price",
      '[class*="price"]',
      "h1",
      'h2:contains("£")',
    ];

    const sizeSelectors = [
      '[data-testid="property-features"]',
      ".key-features",
      'li:contains("sq ft")',
      'li:contains("sq m")',
      'span:contains("sq ft")',
      'span:contains("sq m")',
      'div:contains("sq ft")',
      'div:contains("sq m")',
      ".property-features",
      ".property-description",
      '[class*="feature"]',
      '[class*="size"]',
      'li:contains("SIZE")',
      'div:contains("SIZE")',
    ];

    const bedroomSelectors = [
      'div:contains("BEDROOMS")',
      'span:contains("BEDROOMS")',
      '[data-testid*="bedroom"]',
      '[class*="bedroom"]',
      'li:contains("bedroom")',
      'div:contains("bedroom")',
      ".key-features",
      '[data-testid="property-features"]',
      ".property-features",
    ];

    const addressSelectors = [
      "h1", // Main heading is usually the address
      '[data-testid="address"]',
      '[class*="address"]',
      ".property-address",
      ".property-header h1",
      ".property-title",
      'h1:not(:contains("£"))', // h1 that doesn't contain price
      '[data-testid="property-address"]',
    ];

    const imageSelectors = [
      // Rightmove-specific main gallery selectors (avoid thumbnails)
      '[data-testid="gallery-main"] img',
      '[data-testid="media-viewer-main"] img',
      '[class*="gallery-main"] img',
      '[class*="media-main"] img',
      '[data-testid="gallery"]:not([class*="thumb"]) img',
      '[data-testid="media-viewer"]:not([class*="thumb"]) img',
      '[class*="gallery"]:not([class*="thumb"]):not([class*="thumbnail"]) img',
      // More generic Rightmove gallery selectors
      '[data-testid*="gallery"] img',
      '[data-testid*="media"] img',
      '[class*="PropertyImages"] img',
      '[class*="propertyImages"] img',
      '[class*="Gallery"] img',
      '[class*="MediaGallery"] img',
      // High-quality Rightmove CDN images only
      'img[src*="media.rightmove"][src*="/max/"]',
      'img[src*="media.rightmove"][src*="/640x"]',
      'img[src*="media.rightmove"][src*="/480x"]',
      'img[data-src*="media.rightmove"][data-src*="/max/"]',
      'img[data-src*="media.rightmove"][data-src*="/640x"]',
      // Any Rightmove media images (with quality filtering applied later)
      'img[src*="media.rightmove"]',
      'img[data-src*="media.rightmove"]',
      'img[src*="rightmove-static"]',
      'img[data-src*="rightmove-static"]',
      // Fallback for other property images (but not thumbnails)
      'img[alt*="bedroom"]:not([class*="thumb"])',
      'img[alt*="kitchen"]:not([class*="thumb"])',
      'img[alt*="living"]:not([class*="thumb"])',
      'img[alt*="bathroom"]:not([class*="thumb"])',
    ];

    // Extract address information first
    for (const selector of addressSelectors) {
      const addressElement = $(selector);
      if (addressElement.length > 0) {
        const addressText = addressElement.text().trim();
        // Check if this looks like an address (contains letters and not just price)
        if (
          addressText &&
          !addressText.includes("£") &&
          addressText.length > 5 &&
          /[a-zA-Z]/.test(addressText) &&
          !addressText.toLowerCase().includes("rightmove") &&
          !addressText.toLowerCase().includes("property") &&
          !addressText.toLowerCase().includes("for sale")
        ) {
          extractedText += `Address: ${addressText}\n`;
          break;
        }
      }
    }

    // Extract price information
    for (const selector of priceSelectors) {
      const priceElement = $(selector);
      if (priceElement.length > 0) {
        const priceText = priceElement.text().trim();
        if (priceText && priceText.includes("£")) {
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
        if (
          sizeText &&
          (sizeText.includes("sq") ||
            sizeText.includes("m²") ||
            sizeText.includes("SIZE"))
        ) {
          extractedText += `Size/Features: ${sizeText}\n`;
        }
      }
    }

    // Extract bedroom information
    for (const selector of bedroomSelectors) {
      const bedroomElement = $(selector);
      if (bedroomElement.length > 0) {
        const bedroomText = bedroomElement.text().trim();
        if (
          bedroomText &&
          (bedroomText.toLowerCase().includes("bedroom") ||
            bedroomText.includes("BEDROOMS"))
        ) {
          extractedText += `Bedrooms: ${bedroomText}\n`;
        }
      }
    }

    // Extract image URLs from gallery with quality filtering
    const imageUrls: string[] = [];
    const seenUrls = new Set<string>();
    const seenBaseUrls = new Set<string>(); // Track base URLs to avoid different sizes of same image

    // Helper function to extract base URL (remove size parameters)
    const getBaseUrl = (url: string): string => {
      return url
        .replace(/\/\d+x\d+\//, "/")
        .replace(/_\d+x\d+\./, ".")
        .replace(/\?.*$/, "");
    };

    // Helper function to check if image is acceptable quality
    const isAcceptableQuality = (url: string): boolean => {
      // Only allow actual property images with the standard Rightmove IMG pattern
      const isPropertyImage =
        /_IMG_\d{2}_\d{4}\.(jpe?g|png|webp)$/i.test(url) || // Standard pattern: _IMG_00_0000.jpeg
        /_IMG_\d{1,2}_\d{1,4}\.(jpe?g|png|webp)$/i.test(url) || // Variations: _IMG_0_000.jpeg
        (url.includes("_IMG_") &&
          /\.(jpe?g|png|webp)$/i.test(url) &&
          !url.includes("_max_")); // General IMG pattern without thumbnails

      // Additional check to exclude any remaining low-res patterns
      const isNotThumbnail =
        !url.includes("_thumb") &&
        !url.includes("_small") &&
        !url.includes("/thumb") &&
        !url.includes("_max_") &&
        !url.includes("_bp_") && // Brand partner
        !url.includes("_ad_") && // Advertisement
        !url.includes("_mpu_") && // Medium rectangle ads
        !url.includes("_pd_"); // Promotional/display ads

      return isPropertyImage && isNotThumbnail;
    };

    for (const selector of imageSelectors) {
      $(selector).each((_, img) => {
        let src =
          $(img).attr("src") ||
          $(img).attr("data-src") ||
          $(img).attr("data-lazy-src");

        if (src) {
          // Handle relative URLs
          if (src.startsWith("//")) {
            src = "https:" + src;
          } else if (src.startsWith("/")) {
            src = "https://www.rightmove.co.uk" + src;
          }

          // Get base URL for duplicate checking
          const baseUrl = getBaseUrl(src);

          // Filter criteria
          const isRightmoveMedia =
            src.includes("media.rightmove") || src.includes("rightmove-static");
          const isAcceptableImage = isAcceptableQuality(src);
          const isNotDuplicate =
            !seenUrls.has(src) && !seenBaseUrls.has(baseUrl);
          const isNotSystemImage =
            !src.includes("logo") &&
            !src.includes("icon") &&
            !src.includes("avatar") &&
            !src.includes("agent") &&
            !src.includes("brand") &&
            !src.includes("watermark") &&
            !src.includes("overlay") &&
            !src.includes("marker") &&
            !src.includes("assets/") &&
            !src.includes("static/images/") &&
            !src.includes("banner") &&
            !src.includes("badge") &&
            !src.includes("stamp") &&
            !src.includes("/text/") &&
            !src.includes("_text_") &&
            !src.includes("/UI/") &&
            !src.includes("ui-") &&
            !src.includes("branding") &&
            !src.includes("clarke") &&
            !src.includes("peter") &&
            !src.includes("_bp_") && // Brand partner images
            !src.includes("/bp_") && // Brand partner images
            !src.includes("_ad_") && // Advertisement images
            !src.includes("/ad_") && // Advertisement images
            !src.includes("_mpu_") && // Medium rectangle ads
            !src.includes("_pd_") && // Promotional/display ads
            !src.includes("_promo_") && // Promotional content
            !src.includes("_sponsor_") && // Sponsored content
            !/\/[A-Z]{2,}_/.test(src) && // Pattern like /BRA_something (branding codes)
            !/estate[-_]agent/i.test(src) &&
            !/agent[-_]photo/i.test(src) &&
            !/\d+_bp_/.test(src) && // Timestamp + brand partner pattern
            !/\d+_ad_/.test(src); // Timestamp + ad pattern

          if (
            isRightmoveMedia &&
            isAcceptableImage &&
            isNotDuplicate &&
            isNotSystemImage &&
            imageUrls.length < 20
          ) {
            imageUrls.push(src);
            seenUrls.add(src);
            seenBaseUrls.add(baseUrl);
          }
        }
      });
      if (imageUrls.length >= 20) break;
    }

    // Also try to extract high-quality images from JSON data or script tags
    $("script").each((_, script) => {
      const scriptContent = $(script).html() || "";
      // Look for high-quality image URLs in script content
      const imagePatterns = [
        /https?:\/\/[^"'\s]*media\.rightmove[^"'\s]*\/\d{3,4}x\d{3,4}\/[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/[^"'\s]*media\.rightmove[^"'\s]*\/max\/[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/[^"'\s]*rightmove-static[^"'\s]*\/\d{3,4}x\d{3,4}\/[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
      ];

      imagePatterns.forEach((pattern) => {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            let url = match.replace(/['"]/g, ""); // Remove quotes
            if (url.startsWith("//")) {
              url = "https:" + url;
            }
            const baseUrl = getBaseUrl(url);
            if (
              isAcceptableQuality(url) &&
              !seenUrls.has(url) &&
              !seenBaseUrls.has(baseUrl) &&
              imageUrls.length < 20
            ) {
              imageUrls.push(url);
              seenUrls.add(url);
              seenBaseUrls.add(baseUrl);
            }
          });
        }
      });

      // Extract images from PAGE_MODEL JSON data (Rightmove's main data structure)
      if (
        scriptContent.includes("window.PAGE_MODEL") ||
        scriptContent.includes("propertyData")
      ) {
        try {
          // Try to extract the images array from the JSON structure
          const pageModelMatch = scriptContent.match(
            /window\.PAGE_MODEL\s*=\s*({.+?});?\s*$/s,
          );
          if (pageModelMatch) {
            const pageModel = JSON.parse(pageModelMatch[1]);
            if (pageModel.propertyData && pageModel.propertyData.images) {
              pageModel.propertyData.images.forEach((image: any) => {
                if (image.url) {
                  let url = image.url;
                  if (url.startsWith("//")) {
                    url = "https:" + url;
                  }
                  const baseUrl = getBaseUrl(url);
                  if (
                    !seenUrls.has(url) &&
                    !seenBaseUrls.has(baseUrl) &&
                    imageUrls.length < 20
                  ) {
                    imageUrls.push(url);
                    seenUrls.add(url);
                    seenBaseUrls.add(baseUrl);
                  }

                  // Also try to get higher resolution versions
                  if (image.resizedImageUrls) {
                    Object.values(image.resizedImageUrls).forEach(
                      (resizedUrl: any) => {
                        if (resizedUrl && typeof resizedUrl === "string") {
                          let url = resizedUrl;
                          if (url.startsWith("//")) {
                            url = "https:" + url;
                          }
                          const baseUrl = getBaseUrl(url);
                          if (
                            isAcceptableQuality(url) &&
                            !seenUrls.has(url) &&
                            !seenBaseUrls.has(baseUrl) &&
                            imageUrls.length < 20
                          ) {
                            imageUrls.push(url);
                            seenUrls.add(url);
                            seenBaseUrls.add(baseUrl);
                          }
                        }
                      },
                    );
                  }
                }
              });
            }
          }

          // Also try window.adInfo alternative data structure
          const adInfoMatch = scriptContent.match(
            /window\.adInfo\s*=\s*({.+?});?\s*$/s,
          );
          if (adInfoMatch) {
            const adInfo = JSON.parse(adInfoMatch[1]);
            if (adInfo.propertyData && adInfo.propertyData.images) {
              adInfo.propertyData.images.forEach((image: any) => {
                if (image.url) {
                  let url = image.url;
                  if (url.startsWith("//")) {
                    url = "https:" + url;
                  }
                  const baseUrl = getBaseUrl(url);
                  if (
                    !seenUrls.has(url) &&
                    !seenBaseUrls.has(baseUrl) &&
                    imageUrls.length < 20
                  ) {
                    imageUrls.push(url);
                    seenUrls.add(url);
                    seenBaseUrls.add(baseUrl);
                  }
                }
              });
            }
          }

          // Alternative: look for images array directly in the script content
          const imagesArrayMatch = scriptContent.match(
            /"images":\s*(\[[\s\S]*?\])/,
          );
          if (imagesArrayMatch) {
            try {
              const imagesArray = JSON.parse(imagesArrayMatch[1]);
              if (Array.isArray(imagesArray)) {
                imagesArray.forEach((image: any) => {
                  if (image.url) {
                    let url = image.url;
                    if (url.startsWith("//")) {
                      url = "https:" + url;
                    }
                    const baseUrl = getBaseUrl(url);
                    if (
                      !seenUrls.has(url) &&
                      !seenBaseUrls.has(baseUrl) &&
                      imageUrls.length < 20
                    ) {
                      imageUrls.push(url);
                      seenUrls.add(url);
                      seenBaseUrls.add(baseUrl);
                    }
                  }
                });
              }
            } catch (e) {
              // Ignore parsing errors for this fallback
            }
          }
        } catch (e) {
          // Continue with other methods if JSON parsing fails
          console.log(
            "Failed to parse PAGE_MODEL JSON, continuing with other methods",
          );
        }
      }
    });

    // Look for high-quality images in data attributes
    $("[data-src], [data-lazy-src], [data-original]").each((_, element) => {
      const dataSrc =
        $(element).attr("data-src") ||
        $(element).attr("data-lazy-src") ||
        $(element).attr("data-original");
      if (
        dataSrc &&
        (dataSrc.includes("media.rightmove") ||
          dataSrc.includes("rightmove-static"))
      ) {
        let src = dataSrc;
        if (src.startsWith("//")) {
          src = "https:" + src;
        }
        const baseUrl = getBaseUrl(src);
        if (
          isAcceptableQuality(src) &&
          !seenUrls.has(src) &&
          !seenBaseUrls.has(baseUrl) &&
          imageUrls.length < 20
        ) {
          imageUrls.push(src);
          seenUrls.add(src);
          seenBaseUrls.add(baseUrl);
        }
      }
    });

    // Remove duplicates and prioritize gallery images
    const uniqueImages = [...new Set(imageUrls)];

    // If no images found, try a more aggressive search as fallback
    if (uniqueImages.length === 0) {
      console.log("No gallery images found, trying fallback search...");
      $("img").each((_, img) => {
        let src =
          $(img).attr("src") ||
          $(img).attr("data-src") ||
          $(img).attr("data-lazy-src");
        if (src) {
          // Handle relative URLs
          if (src.startsWith("//")) {
            src = "https:" + src;
          } else if (src.startsWith("/")) {
            src = "https://www.rightmove.co.uk" + src;
          }

          // Only Rightmove media images, basic filtering
          if (
            (src.includes("media.rightmove") ||
              src.includes("rightmove-static")) &&
            !src.includes("logo") &&
            !src.includes("icon") &&
            !src.includes("agent") &&
            !seenUrls.has(src) &&
            imageUrls.length < 15
          ) {
            imageUrls.push(src);
            seenUrls.add(src);
          }
        }
      });
    }

    const finalImages = imageUrls.length > 0 ? imageUrls : uniqueImages;

    if (finalImages.length > 0) {
      extractedText += `Images: ${finalImages.join(", ")}\n`;
    }

    // Look for all elements containing price patterns
    $("*").each((_, element) => {
      const text = $(element).text();
      const priceMatch = text.match(/£[\d,]+/);
      if (priceMatch && !extractedText.includes("Price:")) {
        extractedText += `Found Price: ${priceMatch[0]}\n`;
      }
    });

    // Look for all elements containing sqm/sqft patterns
    $("*").each((_, element) => {
      const text = $(element).text();
      const sqftMatch = text.match(/\d+[\s,]*sq\s*ft/i);
      const sqmMatch = text.match(/\d+\s*(sq\s*m|sqm|m²|square\s*metre)/i);
      if (sqftMatch && !extractedText.includes("sq ft")) {
        extractedText += `Found Size (sq ft): ${sqftMatch[0]}\n`;
      }
      if (sqmMatch && !extractedText.includes("sq m")) {
        extractedText += `Found Size (sq m): ${sqmMatch[0]}\n`;
      }
    });

    // Also extract from meta tags
    $('meta[property="product:price:amount"]').each((_, el) => {
      extractedText += `Meta Price: £${$(el).attr("content")}\n`;
    });

    $('meta[name="description"]').each((_, el) => {
      const description = $(el).attr("content") || "";
      const priceMatch = description.match(/£[\d,]+/);
      const sqftMatch = description.match(/\d+[\s,]*sq\s*ft/i);
      const sqmMatch = description.match(/\d+\s*(sq\s*m|sqm|m²)/i);
      if (priceMatch)
        extractedText += `Meta Description Price: ${priceMatch[0]}\n`;
      if (sqftMatch)
        extractedText += `Meta Description Size (sq ft): ${sqftMatch[0]}\n`;
      if (sqmMatch)
        extractedText += `Meta Description Size (sq m): ${sqmMatch[0]}\n`;
    });

    // Extract from structured data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || "");
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
      const bodyText = $("body").text();
      const priceMatches = bodyText.match(/£[\d,]+/g);
      const sqftMatches = bodyText.match(/\d+[\s,]*sq\s*ft/gi);
      const sqmMatches = bodyText.match(
        /\d+\s*(sq\s*m|sqm|square\s*metres?|m²)/gi,
      );

      if (priceMatches) {
        extractedText += `Found prices: ${priceMatches.slice(0, 5).join(", ")}\n`;
      }
      if (sqftMatches) {
        extractedText += `Found sizes (sq ft): ${sqftMatches.slice(0, 5).join(", ")}\n`;
      }
      if (sqmMatches) {
        extractedText += `Found sizes (sq m): ${sqmMatches.slice(0, 5).join(", ")}\n`;
      }
    }

    return extractedText || extractFromUrlPattern(url);
  } catch (error) {
    // Fallback to URL pattern extraction if scraping fails
    console.error("Scraping error:", error);
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

/**
 * Convert extracted data to full PropertyData schema with calculated/default values
 */
function buildPropertyData(extractedData: any): PropertyData {
  const now = new Date().toISOString();

  // Calculate price per sqm if we have both values
  const pricePerSqM =
    extractedData.square_meters && extractedData.price
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

    // Images
    images: extractedData.images || [],

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
      monthlyPayment: Math.round(
        calculateMonthlyPayment(price * 0.9, monthlyRate90, termMonths),
      ),
      rate: 5.25,
    },
    {
      deposit: Math.round(price * 0.2),
      ltv: 80,
      monthlyPayment: Math.round(
        calculateMonthlyPayment(price * 0.8, monthlyRate80, termMonths),
      ),
      rate: 4.95,
    },
    {
      deposit: Math.round(price * 0.3),
      ltv: 70,
      monthlyPayment: Math.round(
        calculateMonthlyPayment(price * 0.7, monthlyRate70, termMonths),
      ),
      rate: 4.65,
    },
  ];
}

/**
 * Calculate monthly mortgage payment
 */
function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (monthlyRate === 0) return principal / termMonths;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
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
