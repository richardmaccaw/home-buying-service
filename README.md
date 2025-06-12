# Home Buying Service

This project is a Next.js application that analyses UK property listings. Users supply a Rightmove URL and the service returns a detailed report on the property along with an opinionated analysis.

## Features

- **Automatic data extraction** – The app scrapes the provided Rightmove page and uses Google's Gemini model to extract key details such as price, size, number of bedrooms and listing dates.
- **Property data modelling** – Extracted values are converted into a structured `PropertyData` schema that includes valuations, local pricing history and example mortgage costs.
- **Market comparison** – The service queries average prices for the property's postcode to calculate a value‑for‑money score.
- **AI powered verdict** – A short analysis is generated in the style of Ross Kemp and summarises whether the property is worth buying.

## How it works

1. The client sends a property URL to `/api/chat/structured_output`.
2. `ScrapingService` fetches the page and collects relevant text and images.
3. `AIService` calls Gemini to parse that content into structured JSON.
4. `PropertyDataService` fills in any missing fields, calculates mortgage examples and ensures the data matches the schema defined under `lib/schemas/property.ts`.
5. The postcode from the address is sent to `/api/area-average` where `AreaAverageService` uses Gemini to read typical prices from Housemetric.
6. The combined data is cached and shown on `/results` as an interactive report.

## Getting started

1. Copy `.env.example` to `.env.local` and provide your `GOOGLE_API_KEY`.
2. Install dependencies:
   ```bash
   yarn
   ```
3. Run the development server:
   ```bash
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and enter a Rightmove link to generate a property report.

For a breakdown of the property schema used throughout the project, see [`docs/property-schema.md`](docs/property-schema.md).
