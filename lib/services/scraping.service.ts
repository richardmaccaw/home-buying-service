import * as cheerio from 'cheerio';

export class ScrapingService {
  private static readonly DELAY_MS = 1000;

  /**
   * Scrapes a Rightmove page and extracts the HTML content
   */
  async scrapeRightmovePage(url: string): Promise<string> {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, ScrapingService.DELAY_MS));
      
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
        if (response.status === 403 || response.status === 429) {
          return this.extractFromUrlPattern(url);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      return this.extractContentFromHtml(html, url);
      
    } catch (error) {
      console.error('Scraping error:', error);
      return this.extractFromUrlPattern(url);
    }
  }

  /**
   * Fallback function to extract basic info from URL patterns when scraping fails
   */
  private extractFromUrlPattern(url: string): string {
    const urlPattern = /rightmove\.co\.uk\/properties\/(\d+)/;
    const match = url.match(urlPattern);
    
    if (match) {
      return `Property ID: ${match[1]}\nNote: Unable to scrape full details due to access restrictions. Please provide the property details manually or try a different URL.`;
    }
    
    return `URL: ${url}\nNote: Unable to access property details due to website restrictions. Please provide the square meters and price manually, or try accessing the page directly and copying the relevant information.`;
  }

  /**
   * Extract content from HTML using Cheerio
   */
  private extractContentFromHtml(html: string, url: string): string {
    const $ = cheerio.load(html);
    let extractedText = '';
    
    // Extract address information
    extractedText += this.extractAddress($);
    
    // Extract price information
    extractedText += this.extractPrice($);
    
    // Extract size/area information
    extractedText += this.extractSize($);
    
    // Extract bedroom information
    extractedText += this.extractBedrooms($);
    
    // Extract image URLs
    const images = this.extractImages($);
    if (images.length > 0) {
      extractedText += `Images: ${images.join(', ')}\n`;
    }
    
    // Extract additional information from meta tags and structured data
    extractedText += this.extractMetaAndStructuredData($);
    
    // Fallback: extract all text and look for patterns
    if (!extractedText.trim()) {
      extractedText += this.extractFallbackPatterns($);
    }
    
    return extractedText || this.extractFromUrlPattern(url);
  }

  private extractAddress($: cheerio.CheerioAPI): string {
    const addressSelectors = [
      'h1',
      '[data-testid="address"]',
      '[class*="address"]',
      '.property-address',
      '.property-header h1',
      '.property-title',
      'h1:not(:contains("£"))',
      '[data-testid="property-address"]'
    ];

    for (const selector of addressSelectors) {
      const addressElement = $(selector);
      if (addressElement.length > 0) {
        const addressText = addressElement.text().trim();
        if (this.isValidAddress(addressText)) {
          return `Address: ${addressText}\n`;
        }
      }
    }
    return '';
  }

  private isValidAddress(text: string): boolean {
    return Boolean(text && 
           !text.includes('£') && 
           text.length > 5 &&
           /[a-zA-Z]/.test(text) &&
           !text.toLowerCase().includes('rightmove') &&
           !text.toLowerCase().includes('property') &&
           !text.toLowerCase().includes('for sale'));
  }

  private extractPrice($: cheerio.CheerioAPI): string {
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

    for (const selector of priceSelectors) {
      const priceElement = $(selector);
      if (priceElement.length > 0) {
        const priceText = priceElement.text().trim();
        if (priceText && priceText.includes('£')) {
          return `Price: ${priceText}\n`;
        }
      }
    }
    return '';
  }

  private extractSize($: cheerio.CheerioAPI): string {
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

    for (const selector of sizeSelectors) {
      const sizeElement = $(selector);
      if (sizeElement.length > 0) {
        const sizeText = sizeElement.text().trim();
        if (sizeText && (sizeText.includes('sq') || sizeText.includes('m²') || sizeText.includes('SIZE'))) {
          return `Size/Features: ${sizeText}\n`;
        }
      }
    }
    return '';
  }

  private extractBedrooms($: cheerio.CheerioAPI): string {
    const bedroomSelectors = [
      'div:contains("BEDROOMS")',
      'span:contains("BEDROOMS")', 
      '[data-testid*="bedroom"]',
      '[class*="bedroom"]',
      'li:contains("bedroom")',
      'div:contains("bedroom")',
      '.key-features',
      '[data-testid="property-features"]',
      '.property-features'
    ];

    for (const selector of bedroomSelectors) {
      const bedroomElement = $(selector);
      if (bedroomElement.length > 0) {
        const bedroomText = bedroomElement.text().trim();
        if (bedroomText && (bedroomText.toLowerCase().includes('bedroom') || bedroomText.includes('BEDROOMS'))) {
          return `Bedrooms: ${bedroomText}\n`;
        }
      }
    }
    return '';
  }

  private extractImages($: cheerio.CheerioAPI): string[] {
    const imageUrls: string[] = [];
    const seenUrls = new Set<string>();
    const seenBaseUrls = new Set<string>();

    const imageSelectors = [
      '[data-testid="gallery-main"] img',
      '[data-testid="media-viewer-main"] img',
      '[class*="gallery-main"] img',
      '[class*="media-main"] img',
      '[data-testid="gallery"]:not([class*="thumb"]) img',
      '[data-testid="media-viewer"]:not([class*="thumb"]) img',
      '[class*="gallery"]:not([class*="thumb"]):not([class*="thumbnail"]) img',
      '[data-testid*="gallery"] img',
      '[data-testid*="media"] img',
      '[class*="PropertyImages"] img',
      '[class*="propertyImages"] img',
      '[class*="Gallery"] img',
      '[class*="MediaGallery"] img',
      'img[src*="media.rightmove"][src*="/max/"]',
      'img[src*="media.rightmove"][src*="/640x"]',
      'img[src*="media.rightmove"][src*="/480x"]',
      'img[data-src*="media.rightmove"][data-src*="/max/"]',
      'img[data-src*="media.rightmove"][data-src*="/640x"]',
      'img[src*="media.rightmove"]',
      'img[data-src*="media.rightmove"]',
      'img[src*="rightmove-static"]',
      'img[data-src*="rightmove-static"]',
      'img[alt*="bedroom"]:not([class*="thumb"])',
      'img[alt*="kitchen"]:not([class*="thumb"])',
      'img[alt*="living"]:not([class*="thumb"])',
      'img[alt*="bathroom"]:not([class*="thumb"])'
    ];

    for (const selector of imageSelectors) {
      $(selector).each((_, img) => {
        let src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
        
        if (src) {
          src = this.normalizeImageUrl(src);
          const baseUrl = this.getBaseUrl(src);
          
          if (this.isValidImage(src, baseUrl, seenUrls, seenBaseUrls)) {
            imageUrls.push(src);
            seenUrls.add(src);
            seenBaseUrls.add(baseUrl);
          }
        }
      });
      if (imageUrls.length >= 20) break;
    }

    return imageUrls;
  }

  private normalizeImageUrl(url: string): string {
    if (url.startsWith('//')) {
      return 'https:' + url;
    } else if (url.startsWith('/')) {
      return 'https://www.rightmove.co.uk' + url;
    }
    return url;
  }

  private getBaseUrl(url: string): string {
    return url.replace(/\/\d+x\d+\//, '/').replace(/_\d+x\d+\./, '.').replace(/\?.*$/, '');
  }

  private isValidImage(url: string, baseUrl: string, seenUrls: Set<string>, seenBaseUrls: Set<string>): boolean {
    const isRightmoveMedia = url.includes('media.rightmove') || url.includes('rightmove-static');
    const isAcceptableImage = this.isAcceptableQuality(url);
    const isNotDuplicate = !seenUrls.has(url) && !seenBaseUrls.has(baseUrl);
    const isNotSystemImage = !this.isSystemImage(url);

    return isRightmoveMedia && isAcceptableImage && isNotDuplicate && isNotSystemImage;
  }

  private isAcceptableQuality(url: string): boolean {
    const isPropertyImage = /_IMG_\d{2}_\d{4}\.(jpe?g|png|webp)$/i.test(url) ||
                           /_IMG_\d{1,2}_\d{1,4}\.(jpe?g|png|webp)$/i.test(url) ||
                           (url.includes('_IMG_') && /\.(jpe?g|png|webp)$/i.test(url) && !url.includes('_max_'));
    
    const isNotThumbnail = !url.includes('_thumb') &&
                          !url.includes('_small') &&
                          !url.includes('/thumb') &&
                          !url.includes('_max_') &&
                          !url.includes('_bp_') &&
                          !url.includes('_ad_') &&
                          !url.includes('_mpu_') &&
                          !url.includes('_pd_');
    
    return isPropertyImage && isNotThumbnail;
  }

  private isSystemImage(url: string): boolean {
    const systemImagePatterns = [
      'logo', 'icon', 'avatar', 'agent', 'brand', 'watermark',
      'overlay', 'marker', 'assets/', 'static/images/', 'banner',
      'badge', 'stamp', '/text/', '_text_', '/UI/', 'ui-',
      'branding', 'clarke', 'peter', '_bp_', '/bp_', '_ad_',
      '/ad_', '_mpu_', '_pd_', '_promo_', '_sponsor_'
    ];

    return systemImagePatterns.some(pattern => url.includes(pattern)) ||
           /\/[A-Z]{2,}_/.test(url) ||
           /estate[-_]agent/i.test(url) ||
           /agent[-_]photo/i.test(url) ||
           /\d+_bp_/.test(url) ||
           /\d+_ad_/.test(url);
  }

  private extractMetaAndStructuredData($: cheerio.CheerioAPI): string {
    let extractedText = '';

    // Extract from meta tags
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

    return extractedText;
  }

  private extractFallbackPatterns($: cheerio.CheerioAPI): string {
    let extractedText = '';
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

    return extractedText;
  }
} 