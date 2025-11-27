import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("WebSocket Broadcast Server is running");
});

// POST /broadcast accepts JSON { type?, from?, message?, payload? }
// and broadcasts the JSON to all connected WS clients
app.post("/broadcast", (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: "Missing JSON body" });
  }
  const data = JSON.stringify(payload);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
      count++;
    }
  });
  return res.json({ status: "broadcasted", clients: count });
});

// Optional: simple routing to send to a specific client by id (if provided)
// POST /send-to with { id, ...payload }
app.post("/send-to", (req, res) => {
  const { id, ...payload } = req.body || {};
  if (!id) return res.status(400).json({ error: "missing id" });
  let sent = false;
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.clientId === id) {
      client.send(data);
      sent = true;
    }
  });
  if (sent) return res.json({ status: "sent", id });
  return res.status(404).json({ error: "client not found" });
});

const server = http.createServer(app);

// Create WebSocket server on same HTTP server
const wss = new WebSocketServer({ server });

let clientCounter = 1;

wss.on("connection", (ws, req) => {
  // assign a simple client id which can be used with /send-to
  ws.clientId = `client-${clientCounter++}`;
  console.log("Client connected:", ws.clientId);

  // Send welcome message with assigned id
  ws.send(JSON.stringify({ type: "welcome", clientId: ws.clientId }));

  ws.on("message", (message) => {
    // Broadcast any message received from a client to all clients
    console.log("Received from", ws.clientId, "->", message.toString());
    try {
      const parsed = JSON.parse(message.toString());
      // attach sender id if not present
      if (!parsed.from) parsed.from = ws.clientId;
      const outgoing = JSON.stringify(parsed);
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) client.send(outgoing);
      });
    } catch (err) {
      // if message is not JSON, wrap it
      const outgoing = JSON.stringify({ type: "message", from: ws.clientId, data: message.toString() });
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) client.send(outgoing);
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected:", ws.clientId);
  });

  ws.on("error", (err) => {
    console.error("WS error", err);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
