import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
