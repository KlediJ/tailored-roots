import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_KEY || "";

const isAdmin = (req: NextApiRequest) => {
  const headerToken =
    req.headers["x-admin-token"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  return ADMIN_TOKEN && headerToken === ADMIN_TOKEN;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const blackouts = await prisma.blackout.findMany({
      orderBy: { date: "asc" },
    });
    return res.status(200).json({ blackouts });
  } catch (error) {
    console.error("Error fetching blackouts", error);
    return res.status(500).json({ error: "Failed to fetch blackouts" });
  }
}
