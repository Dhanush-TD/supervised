import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper function to execute ml_engine.py
function runPythonEngine(command: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "ml_engine.py");
    const py = spawn("python3", [pythonScript, command]);

    let stdoutData = "";
    let stderrData = "";

    py.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    py.on("close", (code) => {
      if (code !== 0 && !stdoutData.trim()) {
        return reject(new Error(stderrData.trim() || `Python process exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.status === "error") {
          return reject(new Error(parsed.error || "ML engine error"));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse ML engine output: ${stdoutData || stderrData}`));
      }
    });

    py.on("error", (err) => {
      reject(err);
    });

    if (payload !== undefined) {
      const inputStr = typeof payload === "string" ? payload : JSON.stringify(payload);
      py.stdin.write(inputStr);
    }
    py.stdin.end();
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ml_stack: "python-scikit-learn", timestamp: new Date().toISOString() });
});

// Model info
app.get("/api/model/info", async (req, res) => {
  try {
    const info = await runPythonEngine("info");
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Sample dataset
app.get("/api/dataset/sample", async (req, res) => {
  try {
    const sample = await runPythonEngine("sample");
    res.json(sample);
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Parse dataset
app.post("/api/dataset/parse", async (req, res) => {
  try {
    const result = await runPythonEngine("parse", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// Train model
app.post("/api/model/train", async (req, res) => {
  try {
    const result = await runPythonEngine("train", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// Single student prediction
app.post("/api/model/predict", async (req, res) => {
  try {
    const result = await runPythonEngine("predict", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// Batch prediction
app.post("/api/model/batch-predict", async (req, res) => {
  try {
    const result = await runPythonEngine("predict", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Performance ML Server running on port ${PORT}`);
  });
}

startServer();
