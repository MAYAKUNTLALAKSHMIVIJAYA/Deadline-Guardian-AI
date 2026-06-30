import { NextResponse } from "next/server";
import { SchedulerAgent } from "@/lib/ai/multiAgent";

export async function POST(req: Request) {
  try {
    const { userProfile, tasks } = await req.json();
    if (!userProfile || !tasks) {
      return NextResponse.json({ error: "userProfile and tasks are required" }, { status: 400 });
    }
    const result = await SchedulerAgent.generateSchedule(userProfile, tasks);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate schedule" }, { status: 500 });
  }
}
