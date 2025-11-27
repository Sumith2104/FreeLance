WS Broadcast Server - Ready to run
=================================

This package contains a WebSocket broadcast server (Express + ws) and two simple clients (sender & receiver).

How to run locally
------------------
1. Unzip the archive.
2. Start server:
   cd server
   npm install
   npm start

3. Open clients in your browser:
   - client/sender.html
   - client/receiver.html

Server endpoints
----------------
- GET /                health check
- POST /broadcast      body: JSON -> will be broadcast to all connected websocket clients
- POST /send-to        body: { id: "<client-id>", ...payload } -> sends payload to specific client if connected

Notes
-----
- No database, messages are in-memory only.
- Clients receive a welcome message containing their assigned clientId on connection.
