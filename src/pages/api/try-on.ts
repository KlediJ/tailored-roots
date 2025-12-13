import type { NextApiRequest, NextApiResponse } from "next";

type TryOnRequestBody = {
  modelImage?: string;
  selfieImage?: string;
  prompt?: string;
};

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const stripBase64Prefix = (value?: string) =>
  value ? value.replace(/^data:image\/\w+;base64,/, "") : "";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
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

  if (!modelImage || !selfieImage) {
    return res
      .status(400)
      .json({ error: "modelImage and selfieImage are required." });
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              prompt ||
              "Apply the hairstyle from the reference image to the person in the selfie. Keep the face and background natural.",
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: stripBase64Prefix(modelImage),
            },
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: stripBase64Prefix(selfieImage),
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "image/jpeg",
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({ error: "Gemini request failed", details: errorText });
    }

    const result = await response.json();

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

    return res.status(200).json({ outputImage });
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return res.status(500).json({ error: "Failed to generate image." });
  }
}
