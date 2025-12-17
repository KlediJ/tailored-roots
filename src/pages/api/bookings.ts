import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type BookingPayload = {
  name?: string;
  phone?: string;
  notes?: string;
  previewUrl?: string;
  requestedStart?: string;
  requestedEnd?: string;
};

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_KEY || "";
const VALID_STATUSES = ["PENDING", "CONFIRMED", "DECLINED", "DONE"];

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
  const method = req.method;

  if (method === "POST") {
    const {
      name,
      phone,
      notes,
      previewUrl,
      requestedStart,
      requestedEnd,
    }: BookingPayload = req.body || {};

    if (!name || !phone) {
      return res
        .status(400)
        .json({ error: "name and phone are required" });
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          name,
          phone,
          notes,
          previewUrl,
          requestedStart: requestedStart ? new Date(requestedStart) : undefined,
          requestedEnd: requestedEnd ? new Date(requestedEnd) : undefined,
        },
      });
      return res.status(201).json({ booking });
    } catch (error) {
      console.error("Error creating booking", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  }

  if (method === "GET") {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { status } = req.query;
    try {
      const bookings = await prisma.booking.findMany({
        where: status ? { status: String(status).toUpperCase() as any } : {},
        orderBy: { createdAt: "desc" },
      });
      console.log(
        "Bookings GET",
        status ? String(status).toUpperCase() : "ALL",
        "count:",
        bookings.length,
      );
      return res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error fetching bookings", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }

  if (method === "PATCH") {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id, status }: { id?: string; status?: string } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }
    if (!VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: { status: status.toUpperCase() as any },
      });
      return res.status(200).json({ booking });
    } catch (error) {
      console.error("Error updating booking", error);
      return res.status(500).json({ error: "Failed to update booking" });
    }
  }

  if (method === "DELETE") {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "id is required" });
    }
    try {
      await prisma.booking.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error deleting booking", error);
      return res.status(500).json({ error: "Failed to delete booking" });
    }
  }

  res.setHeader("Allow", "GET,POST,PATCH,DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
