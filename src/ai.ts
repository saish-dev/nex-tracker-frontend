// Client for the /api/ai proxy (see vite.config.ts).
const callAI = async (prompt: string, schema?: object): Promise<string> => {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, schema }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'AI request failed');
  return data.text;
};

export interface ParsedLog {
  projectId: string;
  taskType: string;
  description: string;
  timeSpent: number;
  status: string;
}

export const parseWorkLog = async (
  note: string,
  projects: { id: string; name: string; code: string }[],
  taskTypes: string[],
  statuses: string[]
): Promise<ParsedLog> => {
  const prompt = `Convert this rough work note into a structured work log entry.
Note: """${note}"""

Available projects (pick the best match by id; use empty string if none fits):
${projects.map(p => `- ${p.id}: ${p.name} (${p.code})`).join('\n')}

Rules:
- description: one or two clear, professional sentences.
- timeSpent: hours as a number in 0.25 steps. Use the time stated in the note; if none, estimate sensibly.
- status: "Blocked" if the note mentions being stuck/blocked, "In Progress" if unfinished, else "Completed".`;

  const text = await callAI(prompt, {
    type: 'OBJECT',
    properties: {
      projectId: { type: 'STRING', enum: ['', ...projects.map(p => p.id)] },
      taskType: { type: 'STRING', enum: taskTypes },
      description: { type: 'STRING' },
      timeSpent: { type: 'NUMBER' },
      status: { type: 'STRING', enum: statuses },
    },
    required: ['projectId', 'taskType', 'description', 'timeSpent', 'status'],
  });
  return JSON.parse(text);
};

export interface SummaryLog {
  date: string;
  userName?: string;
  projectName: string;
  taskType: string;
  description: string;
  timeSpent: number;
  status: string;
}

export const summarizeLogs = async (
  logs: SummaryLog[],
  scope: { label: string; periodLabel: string; team: boolean }
): Promise<string> => {
  const lines = logs
    .map(l => `${l.date} | ${scope.team ? l.userName + ' | ' : ''}${l.projectName} | ${l.taskType} | ${l.timeSpent}h | ${l.status} | ${l.description}`)
    .join('\n');
  const prompt = `Write a concise ${scope.team ? 'team digest' : 'status report'} for ${scope.label}, period ${scope.periodLabel}, from these work logs.

${lines}

Format in plain text with short sections: "Highlights", "In progress", "Blockers" (omit a section if empty)${scope.team ? ', and "Workload notes" (who is overloaded or under-logged)' : ''}. Use "-" bullets, mention hours per project, and do not invent anything not in the logs.`;
  return callAI(prompt);
};
