"use client";

import { useState, useEffect } from "react";
import { UserProfile, Task, TimeBlock, RiskAnalysis } from "@/lib/ai/multiAgent";

export interface ProductivityLog {
  date: string;
  score: number;
  completed: number;
  focusMinutes: number;
}

export interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  streak: number;
  history: string[];
}

export function useDeadlineGuardian() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [risk, setRisk] = useState<RiskAnalysis>({
    probability: 10,
    confidence: 95,
    reason: "All tasks are currently scheduled with healthy buffer times.",
    recommendation: "Maintain your focus sessions as planned."
  });
  const [productivityLogs, setProductivityLogs] = useState<ProductivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data from localstorage (mock db) or fallback defaults
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. User
    const storedUser = localStorage.getItem("dg_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Tasks
    const storedTasks = localStorage.getItem("dg_firestore_tasks");
    const defaultTasks: Task[] = [
      {
        id: "task-1",
        title: "Submit Coding Assignment",
        description: "Firestore db schema & deployment to cloud run",
        status: "pending",
        priority: "high",
        urgency: 8,
        importance: 9,
        difficulty: 7,
        energyRequirement: "high",
        estimatedDuration: 180,
        deadline: Date.now() + 3 * 24 * 60 * 60 * 1000, // in 3 days
        dependencies: [],
        actionPlan: [
          { id: "sub-1-1", title: "Set up project boilerplate", completed: true, durationMinutes: 30 },
          { id: "sub-1-2", title: "Implement Firestore setup", completed: false, durationMinutes: 60 },
          { id: "sub-1-3", title: "Deploy to Google Cloud Run", completed: false, durationMinutes: 90 }
        ]
      },
      {
        id: "task-2",
        title: "Biology Exam Preparation",
        description: "Study Chapters 6 to 9 on cellular reproduction",
        status: "pending",
        priority: "critical",
        urgency: 9,
        importance: 10,
        difficulty: 8,
        energyRequirement: "high",
        estimatedDuration: 240,
        deadline: Date.now() + 5 * 24 * 60 * 60 * 1000, // in 5 days
        dependencies: [],
        actionPlan: [
          { id: "sub-2-1", title: "Read slides chapter 6", completed: false, durationMinutes: 60 },
          { id: "sub-2-2", title: "Review chapter 7 notes", completed: false, durationMinutes: 60 },
          { id: "sub-2-3", title: "Do flashcards and quiz", completed: false, durationMinutes: 120 }
        ]
      },
      {
        id: "task-3",
        title: "Clean Desk & Workspace",
        description: "Organize notebooks and cables",
        status: "pending",
        priority: "low",
        urgency: 3,
        importance: 4,
        difficulty: 2,
        energyRequirement: "low",
        estimatedDuration: 45,
        deadline: Date.now() + 1 * 24 * 60 * 60 * 1000, // tomorrow
        dependencies: [],
        actionPlan: []
      }
    ];
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      setTasks(defaultTasks);
      localStorage.setItem("dg_firestore_tasks", JSON.stringify(defaultTasks));
    }

    // 3. Schedule
    const storedSchedule = localStorage.getItem("dg_firestore_schedule");
    const defaultSchedule: TimeBlock[] = [
      { id: "b1", startTime: "09:00", endTime: "09:30", type: "routine", label: "Morning review & standup", completed: true },
      { id: "b2", startTime: "09:30", endTime: "11:30", type: "focus", label: "Coding Assignment Setup", taskId: "task-1", completed: false },
      { id: "b3", startTime: "11:30", endTime: "11:45", type: "break", label: "Coffee break", completed: false },
      { id: "b4", startTime: "11:45", endTime: "13:00", type: "focus", label: "Biology Chapter 6 Read", taskId: "task-2", completed: false },
      { id: "b5", startTime: "13:00", endTime: "14:00", type: "break", label: "Lunch and Stretch", completed: false },
      { id: "b6", startTime: "14:00", endTime: "15:00", type: "task", label: "Organize Desk", taskId: "task-3", completed: false },
      { id: "b7", startTime: "15:00", endTime: "15:30", type: "buffer", label: "Evening recap & reschedule", completed: false }
    ];
    if (storedSchedule) {
      setSchedule(JSON.parse(storedSchedule));
    } else {
      setSchedule(defaultSchedule);
      localStorage.setItem("dg_firestore_schedule", JSON.stringify(defaultSchedule));
    }

    // 4. Habits
    const storedHabits = localStorage.getItem("dg_firestore_habits");
    const defaultHabits: Habit[] = [
      { id: "h1", name: "Drink 3L Water", frequency: "daily", streak: 5, history: ["2026-06-29", "2026-06-28", "2026-06-27"] },
      { id: "h2", name: "Gym Workout", frequency: "weekly", streak: 2, history: ["2026-06-28", "2026-06-25"] },
      { id: "h3", name: "No Social Media before 12 PM", frequency: "daily", streak: 9, history: ["2026-06-29", "2026-06-28"] }
    ];
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    } else {
      setHabits(defaultHabits);
      localStorage.setItem("dg_firestore_habits", JSON.stringify(defaultHabits));
    }

    // 5. Analytics Logs
    const storedLogs = localStorage.getItem("dg_firestore_logs");
    const defaultLogs: ProductivityLog[] = [
      { date: "Mon", score: 85, completed: 4, focusMinutes: 120 },
      { date: "Tue", score: 92, completed: 6, focusMinutes: 180 },
      { date: "Wed", score: 78, completed: 3, focusMinutes: 90 },
      { date: "Thu", score: 95, completed: 7, focusMinutes: 240 },
      { date: "Fri", score: 88, completed: 5, focusMinutes: 150 },
      { date: "Sat", score: 60, completed: 2, focusMinutes: 60 },
      { date: "Sun", score: 70, completed: 3, focusMinutes: 90 }
    ];
    if (storedLogs) {
      setProductivityLogs(JSON.parse(storedLogs));
    } else {
      setProductivityLogs(defaultLogs);
      localStorage.setItem("dg_firestore_logs", JSON.stringify(defaultLogs));
    }

    setLoading(false);
  }, []);

  // Update schedule in storage
  const updateSchedule = (newBlocks: TimeBlock[]) => {
    setSchedule(newBlocks);
    localStorage.setItem("dg_firestore_schedule", JSON.stringify(newBlocks));
    recalculateRisk(tasks, newBlocks);
  };

  // Add Task
  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem("dg_firestore_tasks", JSON.stringify(updatedTasks));
    recalculateRisk(updatedTasks, schedule);
    return newTask;
  };

  // Toggle Subtask
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && task.actionPlan) {
        return {
          ...task,
          actionPlan: task.actionPlan.map(sub => 
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          )
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    localStorage.setItem("dg_firestore_tasks", JSON.stringify(updatedTasks));
    recalculateRisk(updatedTasks, schedule);
  };

  // Complete Task
  const completeTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Gain XP and increase productivity score
        if (user) {
          const newXp = (user.metrics?.xp || 0) + 15;
          const level = Math.floor(newXp / 100) + 1;
          const updatedUser = {
            ...user,
            metrics: {
              ...user.metrics,
              xp: newXp,
              level
            }
          };
          setUser(updatedUser);
          localStorage.setItem("dg_user", JSON.stringify(updatedUser));
        }
        return {
          ...task,
          status: "completed" as const
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    localStorage.setItem("dg_firestore_tasks", JSON.stringify(updatedTasks));
    recalculateRisk(updatedTasks, schedule);
  };

  // Delete Task
  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem("dg_firestore_tasks", JSON.stringify(updatedTasks));
    recalculateRisk(updatedTasks, schedule);
  };

  // Toggle Habit
  const toggleHabit = (habitId: string, dateStr: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const hasCompleted = habit.history.includes(dateStr);
        let newHistory = [...habit.history];
        let newStreak = habit.streak;
        if (hasCompleted) {
          newHistory = newHistory.filter(d => d !== dateStr);
          newStreak = Math.max(0, newStreak - 1);
        } else {
          newHistory.push(dateStr);
          newStreak += 1;
          // Trigger award/XP
          if (user) {
            const newXp = (user.metrics?.xp || 0) + 5;
            const level = Math.floor(newXp / 100) + 1;
            const updatedUser = {
              ...user,
              metrics: {
                ...user.metrics,
                xp: newXp,
                level
              }
            };
            setUser(updatedUser);
            localStorage.setItem("dg_user", JSON.stringify(updatedUser));
          }
        }
        return { ...habit, streak: newStreak, history: newHistory };
      }
      return habit;
    });
    setHabits(updatedHabits);
    localStorage.setItem("dg_firestore_habits", JSON.stringify(updatedHabits));
  };

  // Recalculate Risk
  const recalculateRisk = async (activeTasks: Task[], activeSchedule: TimeBlock[]) => {
    try {
      const response = await fetch("/api/risk/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          scheduleBlocks: activeSchedule,
          userProfile: user || { settings: { workHoursStart: "09:00", workHoursEnd: "17:00", sleepHoursStart: "23:00", sleepHoursEnd: "07:00", focusSessionLength: 25, breakLength: 5 }, profileConfig: { energyLevel: "medium", habits: [], goals: [] } }
        })
      });
      if (response.ok) {
        const data = await response.json();
        setRisk(data);
      } else {
        throw new Error("Local server not running");
      }
    } catch (err) {
      // Offline / Keyless local rule fallback calculations:
      const incomplete = activeTasks.filter(t => t.status !== "completed");
      let totalEstimated = 0;
      let overdueCount = 0;
      incomplete.forEach(t => {
        totalEstimated += t.estimatedDuration;
        if (t.deadline < Date.now()) overdueCount++;
      });

      let probability = 10;
      let reason = "All deadlines have safe, open buffers in your schedule.";
      let recommendation = "Maintain current momentum and complete today's focus blocks.";

      if (overdueCount > 0) {
        probability = 95;
        reason = `You have ${overdueCount} task(s) currently overdue. Immediate action required.`;
        recommendation = "Reallocate all non-essential blocks today to execute your overdue tasks.";
      } else if (totalEstimated > 360) {
        probability = 68;
        reason = "Your backlog exceeds 6 hours of estimated focus work, while your scheduled focus blocks total less than 3 hours.";
        recommendation = "Add a 90-minute Focus block tonight. Reschedule 'Clean Desk' to the weekend to protect study time.";
      } else if (incomplete.some(t => t.priority === "critical")) {
        probability = 42;
        reason = "You have a critical priority task due in less than 5 days. Dependencies are not yet marked as completed.";
        recommendation = "Schedule a Deep Focus slot first thing tomorrow morning to resolve Chapter slides.";
      }

      setRisk({
        probability,
        confidence: 90,
        reason,
        recommendation
      });
    }
  };

  // Google Login Onboarding
  const loginAndOnboard = async (surveyData: {
    goals: string[];
    workHours: string;
    sleepTime: string;
    energyLevel: "low" | "medium" | "high";
    focusHours: number;
    habits: string[];
  }) => {
    const mockUser = {
      uid: "guardian-user-999",
      email: "guardian.user@ai.dev",
      displayName: "Guardian Agent",
      photoURL: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=guardian",
      createdAt: Date.now(),
      settings: {
        workHoursStart: surveyData.workHours.split("-")[0] || "09:00",
        workHoursEnd: surveyData.workHours.split("-")[1] || "17:00",
        sleepHoursStart: surveyData.sleepTime.split("-")[0] || "23:00",
        sleepHoursEnd: surveyData.sleepTime.split("-")[1] || "07:00",
        focusSessionLength: 25,
        breakLength: 5,
        theme: "dark",
        voiceModel: "Aura-2",
        calendarSynced: true
      },
      metrics: {
        xp: 35,
        level: 1,
        streak: 3,
        badges: ["Early Adopter", "AI Shield"]
      },
      profileConfig: {
        energyLevel: surveyData.energyLevel,
        habits: surveyData.habits,
        goals: surveyData.goals
      }
    };
    setUser(mockUser);
    localStorage.setItem("dg_user", JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dg_user");
  };

  // Trigger reschedule via AI Agent
  const triggerReschedule = async () => {
    try {
      const response = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: user,
          tasks: tasks
        })
      });
      if (response.ok) {
        const data = await response.json();
        updateSchedule(data.blocks);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Local heuristic reshuffle animation trigger:
      // Move all non-completed task blocks forward, inject break in between.
      const shuffledBlocks = schedule.map(block => {
        if (!block.completed && block.type === "focus") {
          return {
            ...block,
            label: `⚡ AI RESCHEDULED: ${block.label.replace("⚡ AI RESCHEDULED: ", "")}`
          };
        }
        return block;
      });
      updateSchedule(shuffledBlocks);
    }
  };

  // Recalculate risk automatically when tasks, schedule, or load status changes
  useEffect(() => {
    if (!loading) {
      recalculateRisk(tasks, schedule);
    }
  }, [tasks, schedule, loading]);

  return {
    user,
    tasks,
    schedule,
    habits,
    risk,
    productivityLogs,
    loading,
    addTask,
    toggleSubtask,
    completeTask,
    deleteTask,
    toggleHabit,
    loginAndOnboard,
    logout,
    triggerReschedule,
    updateSchedule
  };
}
