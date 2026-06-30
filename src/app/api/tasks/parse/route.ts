import { NextResponse } from "next/server";
import { PlannerAgent } from "@/lib/ai/multiAgent";

export async function POST(req: Request) {
  try {
    const { statement } = await req.json();
    if (!statement) {
      return NextResponse.json({ error: "Statement is required" }, { status: 400 });
    }
    const result = await PlannerAgent.processTaskStatement(statement);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse task statement" }, { status: 500 });
  }
}
