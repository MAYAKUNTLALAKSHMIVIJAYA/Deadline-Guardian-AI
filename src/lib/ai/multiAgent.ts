import { generateJSON, generateText } from "./gemini";

export interface UserProfile {
  settings: {
    workHoursStart: string;
    workHoursEnd: string;
    sleepHoursStart: string;
    sleepHoursEnd: string;
    focusSessionLength: number;
    breakLength: number;
  };
  profileConfig: {
    energyLevel: 'low' | 'medium' | 'high';
    habits: string[];
    goals: string[];
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgency: number; // 1-10
  importance: number; // 1-10
  difficulty: number; // 1-10
  energyRequirement: 'low' | 'medium' | 'high';
  estimatedDuration: number; // minutes
  deadline: number;
  dependencies: string[];
  actionPlan?: { id: string; title: string; completed: boolean; durationMinutes: number }[];
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'break' | 'focus' | 'buffer' | 'routine';
  taskId?: string;
  label: string;
  completed: boolean;
}

export interface RiskAnalysis {
  probability: number; // 0-100
  confidence: number; // 0-100
  reason: string;
  recommendation: string;
}

export const PlannerAgent = {
  async processTaskStatement(input: string): Promise<{ tasks: Omit<Task, "id">[]; calendarEvents: any[] }> {
    const prompt = `
      You are the Planner Agent for Deadline Guardian AI, an elite productivity OS.
      Analyze the user's natural language statement and extract tasks, deadlines, study blocks, and calendar events.
      
      User Statement: "${input}"
      
      Based on this statement:
      1. Create a checklist of tasks.
      2. For each task, estimate its urgency (1-10), importance (1-10), difficulty (1-10), energyRequirement ('low'|'medium'|'high'), estimatedDuration (in minutes), and actionPlan (detailed steps).
      3. Set appropriate deadlines based on context. Note: today's date is June 30, 2026.
      
      Return a JSON object conforming exactly to this structure:
      {
        "tasks": [
          {
            "title": "task title",
            "description": "optional task description",
            "priority": "critical" | "high" | "medium" | "low",
            "urgency": number,
            "importance": number,
            "difficulty": number,
            "energyRequirement": "low" | "medium" | "high",
            "estimatedDuration": number,
            "deadline": number (timestamp in ms),
            "dependencies": [],
            "actionPlan": [
              { "id": "subtask-id", "title": "subtask title", "completed": false, "durationMinutes": number }
            ]
          }
        ],
        "calendarEvents": [
          { "title": "event name", "start": "description of event timing", "duration": number }
        ]
      }
    `;

    return generateJSON<{ tasks: Omit<Task, "id">[]; calendarEvents: any[] }>(prompt, "You are a professional project planner agent. Reply only with JSON.");
  }
};

export const SchedulerAgent = {
  async generateSchedule(user: UserProfile, tasks: Task[]): Promise<{ blocks: TimeBlock[] }> {
    const activeTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high' || t.priority === 'medium');
    const prompt = `
      You are the Scheduler Agent. Allocate time blocks for the day.
      User Settings:
      - Work hours: ${user.settings.workHoursStart} to ${user.settings.workHoursEnd}
      - Sleep hours: ${user.settings.sleepHoursStart} to ${user.settings.sleepHoursEnd}
      - Energy Profile: ${user.profileConfig.energyLevel}
      - Active Tasks to schedule: ${JSON.stringify(activeTasks)}
      
      Requirements:
      1. Divide the day into time blocks (routine, focus, task, break, buffer).
      2. Match high energy tasks (difficult, high energyRequirement) to the morning/afternoon focus slots.
      3. Add break blocks (e.g. 5-15 mins) and routine review blocks.
      4. Avoid scheduling tasks during sleep hours.
      
      Return a JSON object conforming exactly to this structure:
      {
        "blocks": [
          {
            "id": "string",
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "type": "task" | "break" | "focus" | "buffer" | "routine",
            "taskId": "optional associated task id",
            "label": "Block title (e.g. 'Deep Study: Biology')",
            "completed": false
          }
        ]
      }
    `;

    return generateJSON<{ blocks: TimeBlock[] }>(prompt, "You are an expert scheduling agent that organizes daily logs. Reply only with JSON.");
  }
};

export const RiskPredictionAgent = {
  async analyzeRisk(tasks: Task[], scheduleBlocks: TimeBlock[], user: UserProfile): Promise<RiskAnalysis> {
    const prompt = `
      You are the Risk Prediction Agent. Compute the probability that this user will miss their upcoming deadlines.
      Tasks: ${JSON.stringify(tasks)}
      Schedule Blocks: ${JSON.stringify(scheduleBlocks)}
      User Profile: ${JSON.stringify(user)}
      
      Assess if there are enough hours allocated, if dependencies are blocked, or if tasks are scheduled past deadlines.
      Return a JSON object conforming exactly to this structure:
      {
        "probability": number (0 to 100),
        "confidence": number (0 to 100),
        "reason": "Clear explanation of risk factor",
        "recommendation": "Actionable rescheduling advice to reduce risk"
      }
    `;

    return generateJSON<RiskAnalysis>(prompt, "You are an analytical safety engine that computes task failure probability. Reply only with JSON.");
  }
};

export const MotivatorAgent = {
  async generateCoaching(tasks: Task[], risk: RiskAnalysis, userMessage?: string): Promise<string> {
    const msgContext = userMessage ? `\n      User Message: "${userMessage}"` : "";
    const prompt = `
      You are the Motivator Agent, behaving like a personal Chief Productivity Officer.
      Based on the user's tasks and their deadline risk factor:
      Risk Probability: ${risk.probability}%
      Risk Analysis: ${risk.reason}
      Pending Tasks: ${tasks.filter(t => t.status !== "completed").length}${msgContext}
      
      Respond directly to the user's message above. Write a concise, high-impact coaching response (2-3 sentences) that is specific, actionable, and highly motivating.
    `;

    return generateText(prompt, "You are a motivating, high-performance executive coach. Respond directly to the user's specific question. Write in a premium, encouraging tone.");
  }
};

export const ReflectionAgent = {
  async generateDailyReport(tasks: Task[], score: number): Promise<string> {
    const prompt = `
      You are the Reflection Agent. Evaluate the user's performance today.
      Completed Tasks count: ${tasks.filter(t => t.priority !== 'low').length}
      Productivity Score: ${score}
      
      Provide a brief, encouraging retrospective analysis (2 sentences) detailing what went well and what they can adjust tomorrow to improve their Focus Accuracy.
    `;

    return generateText(prompt, "You are an encouraging mentor that helps students reflect on their daily goals.");
  }
};
