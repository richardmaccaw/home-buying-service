import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function PropertyAnalysisPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🏠
          <span className="ml-2">
            This page demonstrates property analysis using{" "}
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            and Google&apos;s{" "}
            <a href="https://ai.google.dev/gemini-api/docs" target="_blank">
              Gemini API
            </a>{" "}
            to extract comprehensive property data from Rightmove URLs.
          </span>
        </li>
        <li>
          🤖
          <span className="ml-2">
            The AI scrapes property pages and extracts structured data including
            price, square meters, bedrooms, bathrooms, and property details.
          </span>
        </li>
        <li className="hidden text-l md:block">
          💻
          <span className="ml-2">
            You can find the scraping and analysis logic in{" "}
            <code>app/api/chat/structured_output/route.ts</code>.
          </span>
        </li>
        <li className="hidden text-l md:block">
          📊
          <span className="ml-2">
            The response includes calculated values like SDLT, mortgage
            payments, price per sqm, and market estimates.
          </span>
        </li>
        <li className="hidden text-l md:block">
          🔧
          <span className="ml-2">
            Uses Zod schema validation to ensure data integrity and type safety
            throughout the application.
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            Try pasting a Rightmove URL like:{" "}
            <code>https://www.rightmove.co.uk/properties/163007567</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/chat/structured_output"
      emptyStateComponent={InfoCard}
      placeholder={`Paste a Rightmove property URL to analyze...`}
      emoji="🏠"
    />
  );
}
