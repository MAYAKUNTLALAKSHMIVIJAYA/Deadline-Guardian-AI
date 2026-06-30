import { NextResponse } from "next/server";
import { RiskPredictionAgent } from "@/lib/ai/multiAgent";

export async function POST(req: Request) {
  try {
    const { tasks, scheduleBlocks, userProfile } = await req.json();
    if (!tasks || !scheduleBlocks || !userProfile) {
      return NextResponse.json({ error: "tasks, scheduleBlocks, and userProfile are required" }, { status: 400 });
    }
    const result = await RiskPredictionAgent.analyzeRisk(tasks, scheduleBlocks, userProfile);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to analyze risk" }, { status: 500 });
  }
}
