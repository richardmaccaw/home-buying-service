import { GoogleGenerativeAI } from "@google/generative-ai";

export class AreaAverageService {
  private readonly model;
  private static readonly TEMPLATE = `You are provided with the HTML source for a Housemetric postcode results page. Extract the mean price per square metre for the postcode {postcode}. Respond ONLY with the numeric value in pounds, no other text.\n\nHTML:\n{html}`;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async extractAverage(html: string, postcode: string): Promise<number> {
    const prompt = AreaAverageService.TEMPLATE
      .replace("{postcode}", postcode)
      .replace("{html}", html);

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const match = text.replace(/[,£]/g, "").match(/\d+(?:\.\d+)?/);
    if (!match) {
      throw new Error("Failed to parse area average");
    }
    return parseFloat(match[0]);
  }
}
