
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WorkLogStatus, TaskType } from './types';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'blocked':
    case 'on_hold':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// --- AI Simulation Utilities ---

// 1. Predictive Categorization
export function predictTaskType(description) {
  const d = description.toLowerCase();
  if (d.includes('meet') || d.includes('sync') || d.includes('standup') || d.includes('call')) return TaskType.MEETING;
  if (d.includes('fix') || d.includes('bug') || d.includes('error') || d.includes('issue')) return TaskType.BUG_FIX;
  if (d.includes('research') || d.includes('investigate') || d.includes('look into') || d.includes('study')) return TaskType.RESEARCH;
  if (d.includes('review') || d.includes('pr') || d.includes('pull request')) return TaskType.REVIEW;
  if (d.includes('implement') || d.includes('create') || d.includes('add') || d.includes('build')) return TaskType.DEVELOPMENT;
  if (d.includes('help') || d.includes('customer') || d.includes('ticket')) return TaskType.SUPPORT;
  return null;
}

// 2. Project Risk Assessment
export function calculateProjectRisk(logs) {
  if (logs.length === 0) return { score: 0, level: 'Low', reason: 'No data available' };

  let score = 0;
  
  // Factor 1: Blocked Tasks
  const blockedCount = logs.filter(l => l.status === WorkLogStatus.BLOCKED).length;
  score += blockedCount * 15;

  // Factor 2: Negative Sentiment Keywords
  const negativeKeywords = ['stuck', 'hard', 'difficult', 'delay', 'problem', 'fail', 'broken', 'slow'];
  const sentimentHits = logs.filter(l => negativeKeywords.some(k => l.description.toLowerCase().includes(k))).length;
  score += sentimentHits * 10;

  // Factor 3: High Bug Ratio
  const bugCount = logs.filter(l => l.taskType === TaskType.BUG_FIX).length;
  if (bugCount / logs.length > 0.4) score += 20;

  let level = 'Low';
  let reason = 'Healthy velocity';

  if (score > 50) {
    level = 'High';
    reason = 'Multiple blockers & negative sentiment detected';
  } else if (score > 20) {
    level = 'Medium';
    reason = 'Increased bug ratio or minor delays';
  }

  return { score, level, reason };
}

// 3. Smart Standup Generator
export function generateSmartSummary(logs, userName) {
  if (logs.length === 0) return `I haven't logged any work for this period yet.`;

  const completed = logs.filter(l => l.status === WorkLogStatus.COMPLETED);
  const inProgress = logs.filter(l => l.status === WorkLogStatus.IN_PROGRESS);
  const blocked = logs.filter(l => l.status === WorkLogStatus.BLOCKED);

  let summary = `**Standup Summary for ${userName}**\n\n`;

  if (completed.length > 0) {
    summary += `✅ **Completed:**\nI successfully finished ${completed.length} tasks. Highlights include ${completed.slice(0, 2).map(l => l.description.toLowerCase()).join(' and ')}.\n\n`;
  }

  if (inProgress.length > 0) {
    summary += `🚧 **In Progress:**\nCurrently focusing on ${inProgress.map(l => l.description).join(', ')}.\n\n`;
  }

  if (blocked.length > 0) {
    summary += `⛔ **Blockers:**\nI am currently blocked on: ${blocked.map(l => l.description).join(', ')}.`;
  } else {
    summary += `✨ No blockers currently.`;
  }

  return summary;
}
