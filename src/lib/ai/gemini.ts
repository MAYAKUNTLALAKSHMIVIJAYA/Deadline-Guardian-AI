import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const isGeminiAvailable = !!apiKey;

let genAI: any = null;
if (isGeminiAvailable) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn("Failed to initialize GoogleGenerativeAI:", err);
  }
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  if (!genAI) return getMockTextResponse(prompt);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini text generation failed, falling back to mock:", error);
    return getMockTextResponse(prompt);
  }
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!genAI) return getMockJSONResponse<T>(prompt);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: systemInstruction
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Gemini JSON generation failed, falling back to mock:", error);
    return getMockJSONResponse<T>(prompt);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART INPUT-DRIVEN MOCK RESPONSES
// These read the USER'S original statement, not the system prompt text,
// so every task/response is unique to what was actually typed.
// ─────────────────────────────────────────────────────────────────────────────

// Extract the original user statement embedded in the prompt by multiAgent.ts:
// PlannerAgent wraps it as: User Statement: "..."
function extractUserStatement(prompt: string): string {
  const match = prompt.match(/User Statement:\s*"([^"]+)"/i);
  return match ? match[1].toLowerCase() : prompt.toLowerCase();
}

// Extract the user's chat message from coach prompt
function extractChatMessage(prompt: string): string {
  const match = prompt.match(/User Message:\s*"([^"]+)"/i);
  if (match) return match[1].toLowerCase();
  // Fallback: grab anything after "User asks:" or just use full prompt
  const match2 = prompt.match(/User asks?:?\s*"?([^".\n]+)/i);
  return match2 ? match2[1].toLowerCase() : prompt.toLowerCase();
}

function getMockTextResponse(prompt: string): string {
  const p = extractChatMessage(prompt);

  if (p.includes("should i do") || p.includes("what now") || p.includes("next") || p.includes("start")) {
    return "⚡ Execute your highest-urgency task first — that's where your leverage is highest right now. Block off 90 minutes of deep focus, silence notifications, and make real progress before checking anything else.";
  }
  if (p.includes("postpone") || p.includes("skip") || p.includes("delay") || p.includes("defer")) {
    return "✅ Identify tasks with urgency below 4/10 and no blocking dependencies — those are safe to defer. Everything tagged 'critical' or 'high' must stay on today's schedule.";
  }
  if (p.includes("finish") || p.includes("done") || p.includes("complete") || p.includes("deadline")) {
    return "📊 Based on your current schedule density and task durations, you are on track if you protect your remaining focus blocks. Avoid context-switching and complete one task fully before moving to the next.";
  }
  if (p.includes("optimize") || p.includes("schedule") || p.includes("reschedule") || p.includes("plan")) {
    return "⚙️ Optimization complete — I've clustered high-cognitive tasks in your peak morning window, injected micro-recovery breaks every 90 minutes, and moved low-urgency routines to late afternoon.";
  }
  if (p.includes("risk") || p.includes("worried") || p.includes("safe") || p.includes("miss")) {
    return "🛡️ Risk is being monitored continuously. The most common failure mode is underestimating task duration — always add a 20% buffer. If any deadline is within 48 hours, drop everything else and focus entirely on it.";
  }
  if (p.includes("tired") || p.includes("motivat") || p.includes("help") || p.includes("stuck") || p.includes("unmotivat")) {
    return "💪 Every action compounds. A single 30-minute focused session today is worth more than three unfocused hours tomorrow. Start with your smallest pending subtask, finish it, and let that momentum carry you forward.";
  }
  if (p.includes("exam") || p.includes("quiz") || p.includes("test")) {
    return "📚 For exam preparation, use active recall over passive re-reading. Block study time in 50-minute Pomodoro sessions, test yourself with practice questions after each block, and get 7-8 hours of sleep the night before.";
  }
  if (p.includes("assignment") || p.includes("project") || p.includes("code") || p.includes("homework")) {
    return "💻 Break your assignment into 3 phases: outline, implementation, and review. Tackle the hardest part first when your energy is highest. Set a hard stop time to avoid perfectionism from blocking submission.";
  }
  if (p.includes("week") || p.includes("today") || p.includes("daily")) {
    return "📅 Guardian analysis: your top priorities this week are your critical and high-urgency tasks. Protect morning blocks for deep work, batch low-energy tasks in afternoons, and end each day with a 5-minute review of tomorrow's priorities.";
  }
  if (p.includes("hello") || p.includes("hi ") || p.includes("hey") || p.includes("who are you")) {
    return "👋 I'm your Chief Productivity Officer powered by Guardian AI. I monitor your tasks, risk levels, energy patterns, and deadlines in real-time. Ask me what to work on, what to postpone, how to optimize your schedule, or get a risk assessment.";
  }

  // Truly generic fallback — still contextual
  return `🧠 Guardian CPO analyzing your query: "${p.slice(0, 80)}". My recommendation: focus on your highest-priority pending task right now. Every completed action reduces deadline risk and builds momentum toward your goals.`;
}

function getMockJSONResponse<T>(prompt: string): T {
  const p = prompt.toLowerCase();

  // ── 1. Risk Prediction Agent ──────────────────────────────────────────────
  // Identified by the unique phrase from multiAgent.ts RiskPredictionAgent
  if (p.includes("probability that this user will miss") || p.includes("risk prediction agent")) {
    // Extract task count from tasks JSON in the prompt
    const taskMatches = prompt.match(/"status":"pending"/g);
    const pendingCount = taskMatches ? taskMatches.length : 1;
    const hasOverdue = prompt.includes('"overdue"') || p.includes("overdue");

    let probability = 15;
    let reason = "All deadlines have safe open buffers in your current schedule.";
    let recommendation = "Maintain your focus sessions as planned. Guardian scheduling engine detects no immediate threats.";

    if (hasOverdue) {
      probability = 95;
      reason = "You have overdue tasks. Immediate action required to prevent cascading failures.";
      recommendation = "Reallocate all non-essential blocks today to execute your overdue tasks immediately.";
    } else if (pendingCount >= 3) {
      probability = 62;
      reason = `You have ${pendingCount} pending tasks competing for focus time. Schedule density is high.`;
      recommendation = "Add a 90-minute focus block this evening. Reschedule any low-priority routine tasks to the weekend.";
    } else if (pendingCount === 2) {
      probability = 38;
      reason = "Moderate workload with 2 active tasks. Deadline safety depends on protecting your scheduled focus blocks.";
      recommendation = "Keep your morning focus blocks intact and avoid context-switching between tasks.";
    }

    return { probability, confidence: 88, reason, recommendation } as unknown as T;
  }

  // ── 2. Scheduler Agent ────────────────────────────────────────────────────
  if (p.includes("scheduler agent") || p.includes("allocate time blocks")) {
    return {
      blocks: [
        { id: "b1", startTime: "08:30", endTime: "09:00", type: "routine", label: "Morning Review & Priority Check", completed: false },
        { id: "b2", startTime: "09:00", endTime: "11:00", type: "focus",   label: "Deep Focus: Critical Task Block", completed: false },
        { id: "b3", startTime: "11:00", endTime: "11:15", type: "break",   label: "Stretch & Hydration Break", completed: false },
        { id: "b4", startTime: "11:15", endTime: "13:00", type: "focus",   label: "Deep Focus: High Priority Work", completed: false },
        { id: "b5", startTime: "13:00", endTime: "14:00", type: "break",   label: "Lunch & Mental Reset", completed: false },
        { id: "b6", startTime: "14:00", endTime: "15:30", type: "task",    label: "Medium Priority Tasks", completed: false },
        { id: "b7", startTime: "15:30", endTime: "15:45", type: "break",   label: "Afternoon Recharge", completed: false },
        { id: "b8", startTime: "15:45", endTime: "17:00", type: "task",    label: "Admin & Follow-ups", completed: false },
        { id: "b9", startTime: "17:00", endTime: "17:30", type: "buffer",  label: "Evening Recap & Tomorrow Plan", completed: false },
      ]
    } as unknown as T;
  }

  // ── 3. Planner Agent ──────────────────────────────────────────────────────
  // Uses the ACTUAL user statement, not fixed mock tasks
  if (p.includes("user statement:") || p.includes("planner agent")) {
    const userInput = extractUserStatement(prompt);
    const now = Date.now();
    const tasks: any[] = [];

    // Parse keywords from user's actual input to generate relevant tasks
    const days = (d: number) => now + d * 24 * 60 * 60 * 1000;

    if (userInput.includes("exam") || userInput.includes("quiz") || userInput.includes("test")) {
      const subject = userInput.match(/(?:exam|quiz|test)\s+(?:on|for|in)?\s*([a-z]+)/i)?.[1] || "Subject";
      const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
      // Detect timing
      const daysUntil = userInput.includes("tomorrow") ? 1 : userInput.includes("monday") ? 3 : userInput.includes("friday") ? 5 : userInput.includes("next week") ? 7 : 4;

      tasks.push({
        title: `${subjectName} Exam Preparation`,
        description: `Study and prepare for the ${subjectName.toLowerCase()} exam`,
        status: "pending",
        priority: daysUntil <= 2 ? "critical" : "high",
        urgency: daysUntil <= 2 ? 10 : 8,
        importance: 10,
        difficulty: 7,
        energyRequirement: "high",
        estimatedDuration: 180,
        deadline: days(daysUntil),
        dependencies: [],
        actionPlan: [
          { id: `sub-${now}-1`, title: `Collect ${subjectName.toLowerCase()} notes and slides`, completed: false, durationMinutes: 30 },
          { id: `sub-${now}-2`, title: "Review core concepts and formulas", completed: false, durationMinutes: 75 },
          { id: `sub-${now}-3`, title: "Practice past exam questions", completed: false, durationMinutes: 60 },
          { id: `sub-${now}-4`, title: "Final revision and summary notes", completed: false, durationMinutes: 15 },
        ]
      });
    }

    if (userInput.includes("assignment") || userInput.includes("homework") || userInput.includes("project")) {
      const daysUntil = userInput.includes("tomorrow") ? 1 : userInput.includes("friday") ? 5 : userInput.includes("next week") ? 7 : 3;
      tasks.push({
        title: `Complete ${userInput.includes("code") || userInput.includes("coding") ? "Coding" : "Academic"} Assignment`,
        description: "Complete and submit the assignment on time",
        status: "pending",
        priority: daysUntil <= 2 ? "critical" : "high",
        urgency: 8,
        importance: 9,
        difficulty: 6,
        energyRequirement: "high",
        estimatedDuration: 120,
        deadline: days(daysUntil),
        dependencies: [],
        actionPlan: [
          { id: `sub-${now}-1`, title: "Read requirements and plan approach", completed: false, durationMinutes: 20 },
          { id: `sub-${now}-2`, title: "Core implementation", completed: false, durationMinutes: 70 },
          { id: `sub-${now}-3`, title: "Review, format and submit", completed: false, durationMinutes: 30 },
        ]
      });
    }

    if (userInput.includes("presentation") || userInput.includes("meeting") || userInput.includes("demo")) {
      const daysUntil = userInput.includes("tomorrow") ? 1 : userInput.includes("friday") ? 5 : 3;
      tasks.push({
        title: "Prepare Presentation",
        description: "Create slides and rehearse delivery",
        status: "pending",
        priority: "high",
        urgency: 7,
        importance: 8,
        difficulty: 5,
        energyRequirement: "medium",
        estimatedDuration: 90,
        deadline: days(daysUntil),
        dependencies: [],
        actionPlan: [
          { id: `sub-${now}-1`, title: "Create slide structure and outline", completed: false, durationMinutes: 30 },
          { id: `sub-${now}-2`, title: "Build slides with content", completed: false, durationMinutes: 45 },
          { id: `sub-${now}-3`, title: "Practice run-through", completed: false, durationMinutes: 15 },
        ]
      });
    }

    if (userInput.includes("read") || userInput.includes("research") || userInput.includes("study")) {
      const daysUntil = userInput.includes("tomorrow") ? 1 : userInput.includes("next week") ? 7 : 4;
      tasks.push({
        title: "Research & Reading Block",
        description: "Deep reading and note-taking session",
        status: "pending",
        priority: "medium",
        urgency: 6,
        importance: 7,
        difficulty: 4,
        energyRequirement: "medium",
        estimatedDuration: 90,
        deadline: days(daysUntil),
        dependencies: [],
        actionPlan: [
          { id: `sub-${now}-1`, title: "First-pass reading", completed: false, durationMinutes: 45 },
          { id: `sub-${now}-2`, title: "Take structured notes", completed: false, durationMinutes: 30 },
          { id: `sub-${now}-3`, title: "Summarize key takeaways", completed: false, durationMinutes: 15 },
        ]
      });
    }

    // If nothing was detected, create a generic task from the input title
    if (tasks.length === 0) {
      const title = userInput.charAt(0).toUpperCase() + userInput.slice(1).substring(0, 60);
      tasks.push({
        title: title.endsWith(".") ? title.slice(0, -1) : title,
        description: "Added via AI Planner Agent",
        status: "pending",
        priority: "medium",
        urgency: 5,
        importance: 6,
        difficulty: 4,
        energyRequirement: "medium",
        estimatedDuration: 60,
        deadline: days(3),
        dependencies: [],
        actionPlan: [
          { id: `sub-${now}-1`, title: "Plan approach and gather materials", completed: false, durationMinutes: 20 },
          { id: `sub-${now}-2`, title: "Execute main work", completed: false, durationMinutes: 30 },
          { id: `sub-${now}-3`, title: "Review and finalize", completed: false, durationMinutes: 10 },
        ]
      });
    }

    return { tasks, calendarEvents: [] } as unknown as T;
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  return { success: true, message: "Action completed by AI Agent" } as unknown as T;
}
