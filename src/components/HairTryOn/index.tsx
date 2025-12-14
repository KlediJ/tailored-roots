/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

type HairTryOnProps = {
  onBook?: (payload: { selfie: string; output: string }) => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unable to read file."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const fetchAsDataUrl = async (path: string) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Unable to load inspiration image.");
  const blob = await res.blob();
  return await readFileAsDataUrl(
    new File([blob], "inspiration.jpg", { type: blob.type || "image/jpeg" }),
  );
};

const getDataUrlSizeBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const downscaleImage = async (
  file: File,
  maxDim = 1400,
  qualities = [0.82, 0.72],
) => {
  const dataUrl = await readFileAsDataUrl(file);
  const img = new Image();

  return await new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, targetW, targetH);

      for (const quality of qualities) {
        const out = canvas.toDataURL("image/jpeg", quality);
        if (getDataUrlSizeBytes(out) <= 4 * 1024 * 1024) {
          return resolve(out);
        }
      }
      return reject(new Error("Image is too large after compression."));
    };
    img.onerror = () => reject(new Error("Unable to process image."));
    img.src = dataUrl;
  });
};

function HairTryOn({ onBook }: HairTryOnProps) {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspirationLoading, setInspirationLoading] = useState<string | null>(
    null,
  );
  const [selectedInspirationId, setSelectedInspirationId] = useState<
    string | null
  >(null);

  const hasBothImages = Boolean(modelImage && selfieImage);

  const inspirations = [
    {
      id: "dimensional-blonde",
      title: "Dimensional Blonde",
      image: "/lookbook/dimensional-blonde.jpg",
    },
    {
      id: "lived-in-brunette",
      title: "Lived-In Brunette",
      image: "/lookbook/lived-in-brunette.jpg",
    },
    { id: "copper-glow", title: "Copper Glow", image: "/lookbook/copper-glow.jpg" },
    { id: "silver-blend", title: "Silver Blend", image: "/lookbook/silver-blend.jpg" },
    {
      id: "protective-twist",
      title: "Protective Twist",
      image: "/lookbook/protective-twist.jpg",
    },
    { id: "silk-press", title: "Silk Press", image: "/lookbook/silk-press.jpg" },
  ];

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, type: "model" | "selfie") => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 12 * 1024 * 1024) {
        setError("Please upload images under 12MB.");
        return;
      }
      try {
        const dataUrl = await downscaleImage(file);
        if (type === "model") {
          setModelImage(dataUrl);
        } else {
          setSelfieImage(dataUrl);
        }
        setSelectedInspirationId(null);
      } catch (err) {
        setError((err as Error).message || "Failed to load image.");
      }
    },
    [],
  );

  const handleInspirationSelect = useCallback(async (id: string, path: string) => {
    setError(null);
    setInspirationLoading(id);
    try {
      const dataUrl = await fetchAsDataUrl(path);
      setModelImage(dataUrl);
      setSelectedInspirationId(id);
    } catch (err) {
      setError((err as Error).message || "Failed to load inspiration.");
    } finally {
      setInspirationLoading(null);
    }
  }, []);

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
    <section id="tryon" className="space-y-10">
      <header className="space-y-3 rounded-2xl bg-neutral-900/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Tailored Roots Preview
            </p>
            <h1 className="text-3xl font-semibold">See the look before the chair</h1>
          </div>
          <div className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-200">
            Live preview ready
          </div>
        </div>
        <p className="text-sm text-neutral-200">
          Upload or pick a hairstyle reference, add your selfie, and we’ll blend the look while
          keeping your face, skin tone, and background unchanged.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Step 1", text: "Upload hairstyle reference" },
            { label: "Step 2", text: "Upload your selfie" },
            { label: "Step 3", text: "Generate & compare" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
            >
              <p className="text-xs font-semibold text-neutral-300">
                {item.label}
              </p>
              <p className="text-neutral-100">{item.text}</p>
            </div>
          ))}
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-lg backdrop-blur"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="group flex h-full flex-col gap-3 rounded-xl border border-dashed border-neutral-300 bg-white/70 p-4 transition hover:border-neutral-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-800">
                  Hairstyle reference (upload or pick below)
                </p>
                <p className="text-xs text-neutral-600">
                  Clear shot of the style you want to try on.
                </p>
              </div>
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                Upload
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, "model")}
              className="text-sm"
            />
            {modelImage && (
              <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
                <img
                  src={modelImage}
                  alt="Hairstyle reference preview"
                  className="h-72 w-full object-cover"
                />
              </div>
            )}
          </label>

          <label className="group flex h-full flex-col gap-3 rounded-xl border border-dashed border-neutral-300 bg-white/70 p-4 transition hover:border-neutral-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-800">
                  Your selfie
                </p>
                <p className="text-xs text-neutral-600">
                  Front-facing, good lighting, no heavy filters.
                </p>
              </div>
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                Upload
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, "selfie")}
              className="text-sm"
            />
            {selfieImage && (
              <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
                <img
                  src={selfieImage}
                  alt="Selfie preview"
                  className="h-72 w-full object-cover"
                />
              </div>
            )}
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || !hasBothImages}
              className="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating..." : "Generate Try-On"}
            </button>
            <span className="text-xs text-neutral-600">
              {hasBothImages
                ? "Ready to generate."
                : "Upload both images to enable."}
            </span>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </form>

      {outputImage && selfieImage && (
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              Before / After
            </h2>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Preview
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-800">Before</p>
              <img
                src={selfieImage}
                alt="Before hairstyle"
                className="w-full rounded-lg border border-neutral-200 object-cover"
              />
            </div>
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-800">After</p>
              <img
                src={`data:image/png;base64,${outputImage}`}
                alt="After hairstyle"
                className="w-full rounded-lg border border-neutral-200 object-cover"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onBook?.({ selfie: selfieImage, output: outputImage })
                  }
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Book this look
                </button>
                <p className="text-xs text-neutral-600">
                  Attach this preview to your booking request.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        id="inspiration"
        className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white/90 p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Curated inspiration
            </p>
            <p className="text-sm text-neutral-700">
              Or pick a house look as your hairstyle reference.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {inspirations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleInspirationSelect(item.id, item.image)}
            className={`flex flex-col overflow-hidden rounded-xl border text-left shadow-sm transition ${
                selectedInspirationId === item.id
                  ? "border-neutral-900"
                  : "border-neutral-200 hover:-translate-y-0.5 hover:shadow-md"
              }`}
            disabled={!!inspirationLoading}
          >
              <div className="relative h-56 w-full bg-neutral-200">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-neutral-900">
                  {item.title}
                </p>
                <p className="text-xs text-neutral-600">
                  {inspirationLoading === item.id
                    ? "Loading..."
                    : "Use this look"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HairTryOn;
  const inspirations = [
    {
      id: "dimensional-blonde",
      title: "Dimensional Blonde",
      image: "/lookbook/dimensional-blonde.jpg",
    },
    {
      id: "lived-in-brunette",
      title: "Lived-In Brunette",
      image: "/lookbook/lived-in-brunette.jpg",
    },
    { id: "copper-glow", title: "Copper Glow", image: "/lookbook/copper-glow.jpg" },
    { id: "silver-blend", title: "Silver Blend", image: "/lookbook/silver-blend.jpg" },
    {
      id: "protective-twist",
      title: "Protective Twist",
      image: "/lookbook/protective-twist.jpg",
    },
    { id: "silk-press", title: "Silk Press", image: "/lookbook/silk-press.jpg" },
  ];
