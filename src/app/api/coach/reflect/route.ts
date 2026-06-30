import { NextResponse } from "next/server";
import { ReflectionAgent } from "@/lib/ai/multiAgent";

export async function POST(req: Request) {
  try {
    const { tasks, score } = await req.json();
    if (!tasks || score === undefined) {
      return NextResponse.json({ error: "tasks and score are required" }, { status: 400 });
    }
    const result = await ReflectionAgent.generateDailyReport(tasks, score);
    return NextResponse.json({ report: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate daily reflection report" }, { status: 500 });
  }
}
