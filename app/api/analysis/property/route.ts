import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PropertyData } from "@/lib/types";

export const runtime = "nodejs";

const ROSS_KEMP_SYSTEM_PROMPT = `You are Ross Kemp, the tough, no-nonsense investigative journalist and former EastEnders actor. You're analyzing UK properties with your characteristic blunt, straight-talking style.

PERSONALITY TRAITS:
- Direct and brutally honest
- Uses working-class London expressions
- References your investigative journalism background
- Mentions property as an investment, not just a home
- Drops in occasional references to your EastEnders days or documentary work
- Uses phrases like "Let me tell you something", "This is the reality", "I've seen enough to know"
- Speaks with authority and experience

ANALYSIS STYLE:
- Start with a strong opening statement
- Be opinionated and decisive
- Include specific numbers and facts from the data
- Consider the investment potential, not just living there
- Reference local area knowledge if relevant
- End with a clear BUY/DON'T BUY recommendation

Keep the response to 2-3 paragraphs maximum. Be engaging, authoritative, and memorable.`;

const ANALYSIS_TEMPLATE = `Based on the following property data, provide your brutally honest assessment of whether this property is worth buying:

Property Details:
- Address: {address}
- Price: £{price:,}
- Price per sqm: £{pricePerSqM}/sqm
- Bedrooms: {bedrooms}
- Bathrooms: {bathrooms}
- Property Type: {propertyType}
- Tenure: {tenure}
- Condition: {condition}

Market Analysis:
- Zoopla Valuation: £{zooplaVal:,}
- ONS Valuation: £{onsVal:,}
- Acadata Valuation: £{acadataVal:,}
- Last Sale Price: £{lastSalePrice:,} ({lastSaleDate})
- Growth Since Last Sale: {growthSinceLastSale}%
- Value for Money Score: {valueForMoney}/10

Financial Costs:
- SDLT: £{sdlt:,}
- Total Purchase Costs: £{totalCosts:,}

Local Area:
- ONS Area Price Change: {onsAreaChange}%
- Average for {propertyType}: £{postcodeAverage:,}

Give me your honest, Ross Kemp-style verdict on whether they should buy this property or walk away.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const propertyData: PropertyData = body.propertyData;

    if (!propertyData) {
      return NextResponse.json({ 
        error: "Property data is required" 
      }, { status: 400 });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Calculate total costs
    const totalCosts = propertyData.costs.sdlt + propertyData.costs.conveyancing + propertyData.costs.survey;

    // Get postcode average for property type
    const postcodeAverage = propertyData.localArea.postcodeAverage[propertyData.propertyType as keyof typeof propertyData.localArea.postcodeAverage] || 0;

    // Create the analysis prompt
    const prompt = `${ROSS_KEMP_SYSTEM_PROMPT}\n\n${ANALYSIS_TEMPLATE}`
      .replace("{address}", propertyData.address)
      .replace("{price:,}", propertyData.price.toLocaleString())
      .replace("{pricePerSqM}", propertyData.pricePerSqM.toString())
      .replace("{bedrooms}", propertyData.bedrooms.toString())
      .replace("{bathrooms}", propertyData.bathrooms.toString())
      .replace("{propertyType}", propertyData.propertyType || "unknown")
      .replace("{tenure}", propertyData.tenure)
      .replace("{condition}", propertyData.condition)
      .replace("{zooplaVal:,}", propertyData.indices.zoopla.toLocaleString())
      .replace("{onsVal:,}", propertyData.indices.ons.toLocaleString())
      .replace("{acadataVal:,}", propertyData.indices.acadata.toLocaleString())
      .replace("{lastSalePrice:,}", propertyData.history.lastSalePrice.toLocaleString())
      .replace("{lastSaleDate}", new Date(propertyData.history.lastSaleDate).getFullYear().toString())
      .replace("{growthSinceLastSale}", propertyData.history.growthSinceLastSale.toString())
      .replace("{valueForMoney}", propertyData.valueForMoney.toString())
      .replace("{sdlt:,}", propertyData.costs.sdlt.toLocaleString())
      .replace("{totalCosts:,}", totalCosts.toLocaleString())
      .replace("{onsAreaChange}", propertyData.localArea.onsAreaChange.toString())
      .replace("{postcodeAverage:,}", postcodeAverage.toLocaleString());

    // Generate the analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    // Determine overall verdict and confidence
    const lowerAnalysis = analysis.toLowerCase();
    let overallVerdict = "neutral";
    let confidence = 0.7;

    if (lowerAnalysis.includes("buy") && !lowerAnalysis.includes("don't buy")) {
      overallVerdict = "positive";
      confidence = 0.85;
    } else if (lowerAnalysis.includes("don't buy") || lowerAnalysis.includes("avoid") || lowerAnalysis.includes("walk away")) {
      overallVerdict = "negative";
      confidence = 0.85;
    }

    // Extract key insights based on the data
    const keyInsights = [];
    const riskFactors = [];
    const recommendations = [];

    // Price analysis insights
    const avgValuation = (propertyData.indices.zoopla + propertyData.indices.ons + propertyData.indices.acadata) / 3;
    if (propertyData.price > avgValuation * 1.1) {
      riskFactors.push(`Property is priced ${Math.round(((propertyData.price / avgValuation) - 1) * 100)}% above average valuations`);
    } else if (propertyData.price < avgValuation * 0.9) {
      keyInsights.push(`Property is priced ${Math.round((1 - (propertyData.price / avgValuation)) * 100)}% below average valuations`);
    }

    // Growth analysis
    if (propertyData.history.growthSinceLastSale > 30) {
      keyInsights.push(`Strong growth of ${propertyData.history.growthSinceLastSale}% since last sale`);
    } else if (propertyData.history.growthSinceLastSale < 10) {
      riskFactors.push(`Modest growth of only ${propertyData.history.growthSinceLastSale}% since last sale`);
    }

    // Value for money
    if (propertyData.valueForMoney >= 8) {
      keyInsights.push("Excellent value for money score");
    } else if (propertyData.valueForMoney <= 5) {
      riskFactors.push("Below average value for money score");
    }

    // Recommendations
    recommendations.push("Get a professional survey done before proceeding");
    recommendations.push("Consider the total cost including SDLT and fees");
    if (propertyData.condition === "renovation") {
      recommendations.push("Factor in renovation costs for your budget");
    }

    return NextResponse.json({
      overallVerdict: analysis,
      keyInsights,
      recommendations,
      riskFactors,
      confidence,
    }, { status: 200 });

  } catch (e: any) {
    console.error("Gemini API Error:", e);
    return NextResponse.json({ 
      error: "Failed to generate property analysis" 
    }, { status: e.status ?? 500 });
  }
} 