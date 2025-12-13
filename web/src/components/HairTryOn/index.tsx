/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] || result;
        resolve(base64);
      } else {
        reject(new Error("Unable to read file."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

function HairTryOn() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, type: "model" | "selfie") => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const base64 = await readFileAsBase64(file);
        if (type === "model") {
          setModelImage(base64);
        } else {
          setSelfieImage(base64);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load image.");
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!modelImage || !selfieImage) {
        setError("Please upload both images before continuing.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setOutputImage(null);

      try {
        const response = await fetch("/api/try-on", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modelImage, selfieImage }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate try-on.");
        }

        const data = await response.json();
        setOutputImage(data.outputImage);
      } catch (err) {
        setError((err as Error).message || "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [modelImage, selfieImage],
  );

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">AI Hair Try-On</h1>
        <p className="text-sm">
          Upload a hairstyle reference and your selfie to preview the look.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block font-medium">Upload hairstyle reference</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, "model")}
              className="w-full"
            />
            {modelImage && (
              <img
                src={`data:image/jpeg;base64,${modelImage}`}
                alt="Hairstyle reference preview"
                className="h-48 w-full rounded border object-cover"
              />
            )}
          </label>

          <label className="space-y-2">
            <span className="block font-medium">Upload your selfie</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, "selfie")}
              className="w-full"
            />
            {selfieImage && (
              <img
                src={`data:image/jpeg;base64,${selfieImage}`}
                alt="Selfie preview"
                className="h-48 w-full rounded border object-cover"
              />
            )}
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded border px-4 py-2 disabled:opacity-60"
          >
            {isLoading ? "Generating..." : "Generate Try-On"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>

      {outputImage && selfieImage && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Before / After</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Before</p>
              <img
                src={`data:image/jpeg;base64,${selfieImage}`}
                alt="Before hairstyle"
                className="w-full rounded border object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">After</p>
              <img
                src={`data:image/jpeg;base64,${outputImage}`}
                alt="After hairstyle"
                className="w-full rounded border object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HairTryOn;
