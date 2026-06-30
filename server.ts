import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PlannerAgent, SchedulerAgent, RiskPredictionAgent, MotivatorAgent, ReflectionAgent } from "./src/lib/ai/multiAgent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root route API index
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Deadline Guardian AI Multi-Agent API Engine",
    endpoints: {
      health: "/api/health",
      planner: "/api/tasks/parse",
      scheduler: "/api/schedule/generate",
      risk: "/api/risk/analyze",
      coaching: "/api/coach/motivate",
      reflection: "/api/coach/reflect"
    }
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Deadline Guardian AI Backend" });
});

// 1. Planner Agent Endpoint
app.post("/api/tasks/parse", async (req, res) => {
  try {
    const { statement } = req.body;
    if (!statement) {
      return res.status(400).json({ error: "Statement is required" });
    }
    const result = await PlannerAgent.processTaskStatement(statement);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to parse task statement" });
  }
});

// 2. Scheduler Agent Endpoint
app.post("/api/schedule/generate", async (req, res) => {
  try {
    const { userProfile, tasks } = req.body;
    if (!userProfile || !tasks) {
      return res.status(400).json({ error: "userProfile and tasks are required" });
    }
    const result = await SchedulerAgent.generateSchedule(userProfile, tasks);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate schedule" });
  }
});

// 3. Risk Prediction Endpoint
app.post("/api/risk/analyze", async (req, res) => {
  try {
    const { tasks, scheduleBlocks, userProfile } = req.body;
    if (!tasks || !scheduleBlocks || !userProfile) {
      return res.status(400).json({ error: "tasks, scheduleBlocks, and userProfile are required" });
    }
    const result = await RiskPredictionAgent.analyzeRisk(tasks, scheduleBlocks, userProfile);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to analyze risk" });
  }
});

// 4. Motivator Agent Endpoint
app.post("/api/coach/motivate", async (req, res) => {
  try {
    const { tasks, risk, message } = req.body;
    if (!tasks) {
      return res.status(400).json({ error: "tasks are required" });
    }
    // Provide a default risk object if not supplied
    const safeRisk = risk || { probability: 20, confidence: 80, reason: "No risk data", recommendation: "Stay on plan." };
    const result = await MotivatorAgent.generateCoaching(tasks, safeRisk, message);
    res.json({ message: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate coaching message" });
  }
});

// 5. Reflection Agent Endpoint
app.post("/api/coach/reflect", async (req, res) => {
  try {
    const { tasks, score } = req.body;
    if (!tasks || score === undefined) {
      return res.status(400).json({ error: "tasks and score are required" });
    }
    const result = await ReflectionAgent.generateDailyReport(tasks, score);
    res.json({ report: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate daily reflection report" });
  }
});

app.listen(PORT, () => {
  console.log(`[Deadline Guardian Backend] Server is running on port ${PORT}`);
});
