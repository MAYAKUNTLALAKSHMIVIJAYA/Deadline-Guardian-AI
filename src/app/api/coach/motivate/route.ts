import { NextResponse } from "next/server";
import { MotivatorAgent } from "@/lib/ai/multiAgent";

export async function POST(req: Request) {
  try {
    const { tasks, risk, message } = await req.json();
    if (!tasks) {
      return NextResponse.json({ error: "tasks are required" }, { status: 400 });
    }
    const safeRisk = risk || { probability: 20, confidence: 80, reason: "No risk data", recommendation: "Stay on plan." };
    const result = await MotivatorAgent.generateCoaching(tasks, safeRisk, message);
    return NextResponse.json({ message: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate coaching message" }, { status: 500 });
  }
}
