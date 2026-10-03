import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const GEMINI_MODEL = 'gemini-2.5-flash';

// Server-side proxy for AI features. The API key never reaches the browser bundle.
const aiProxy = (apiKey: string | undefined): Plugin => {
  const handler = async (req: any, res: any, next: () => void) => {
    if (req.url !== '/api/ai' || req.method !== 'POST') return next();
    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (!apiKey) return send(500, { error: 'GEMINI_API_KEY is not set in .env.local' });

    let raw = '';
    for await (const chunk of req) raw += chunk;
    try {
      const { prompt, schema } = JSON.parse(raw);
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: schema
              ? { responseMimeType: 'application/json', responseSchema: schema }
              : {},
          }),
        }
      );
      const data: any = await upstream.json();
      if (!upstream.ok) return send(upstream.status, { error: data?.error?.message || 'AI request failed' });
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      send(200, { text });
    } catch (e: any) {
      send(500, { error: e?.message || 'AI request failed' });
    }
  };

  return {
    name: 'ai-proxy',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), aiProxy(env.GEMINI_API_KEY)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
