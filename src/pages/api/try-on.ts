import type { NextApiRequest, NextApiResponse } from "next";

type TryOnRequestBody = {
  modelImage?: string;
  selfieImage?: string;
  prompt?: string;
  model?: string;
};

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const DEFAULT_MODEL =
  process.env.GEMINI_MODEL || "gemini-3-pro-image-preview";

const parseImage = (
  value?: string,
): { mimeType: string; data: string } | null => {
  if (!value) return null;

  const dataUrlMatch = value.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return { mimeType: dataUrlMatch[1], data: dataUrlMatch[2] };
  }

  // Fallback: assume jpeg if only raw base64 is provided.
  return { mimeType: "image/jpeg", data: value };
};

export const config = {
  api: {
    bodyParser: {
      // Keep below Vercel's ~4.5MB function body limit; front-end also enforces.
      sizeLimit: "8mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Missing Google API key" });
  }

  const { modelImage, selfieImage, prompt }: TryOnRequestBody = req.body || {};
  const model =
    (req.body as any)?.model ||
    DEFAULT_MODEL;

  console.log("GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
  console.log("GOOGLE_API_KEY length:", process.env.GOOGLE_API_KEY?.length);
  console.log("REQ BODY:", req.body);

  if (!modelImage || !selfieImage) {
    return res
      .status(400)
      .json({ error: "modelImage and selfieImage are required." });
  }

  const parsedModel = parseImage(modelImage);
  const parsedSelfie = parseImage(selfieImage);

  if (!parsedModel || !parsedSelfie) {
    return res
      .status(400)
      .json({ error: "Invalid images. Please re-upload and try again." });
  }

  console.log("API KEY PRESENT:", !!GOOGLE_API_KEY);
  console.log("REQ BODY:", {
    modelMime: parsedModel.mimeType,
    selfieMime: parsedSelfie.mimeType,
    modelBytes: parsedModel.data.length,
    selfieBytes: parsedSelfie.data.length,
    targetModel: model,
  });

  const requestBody = {
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              prompt ||
              [
                "You are a pro stylist image editor.",
                "Use the first image ONLY for hair reference.",
                "Use the second image (selfie) as the base. The final face, skin tone, expression, body/pose, clothing, and background must match the selfie exactly.",
                "Do NOT copy or replace the face from the reference. Ignore the reference face entirely—only take hair shape, length, texture, part, and color.",
                "If the selfie is low quality, dim, cropped, or partially obstructed, clean it up: normalize lighting, remove noise, and infer any obscured hair naturally while keeping identity intact.",
                "Do not alter identity or facial features. Only change the hair.",
              ].join(" "),
          },
          { text: "Client selfie (base for final image):" },
          {
            inlineData: {
              mimeType: parsedSelfie.mimeType,
              data: parsedSelfie.data,
            },
          },
          { text: "Hairstyle reference (hair only, ignore face/background):" },
          {
            inlineData: {
              mimeType: parsedModel.mimeType,
              data: parsedModel.data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", result);
      return res
        .status(response.status)
        .json({ error: "Gemini request failed", details: result });
    }

    const imagePart =
      result?.candidates?.[0]?.content?.parts?.find(
        (part: any) => part?.inlineData?.data || part?.inline_data?.data,
      ) || null;

    const outputImage =
      imagePart?.inlineData?.data || imagePart?.inline_data?.data;

    if (!outputImage) {
      return res
        .status(500)
        .json({ error: "No image returned from Gemini response." });
    }

    console.log("OUTPUT BYTES:", outputImage.length);

    return res.status(200).json({ outputImage });
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return res.status(500).json({ error: "Failed to generate image." });
  }
}
