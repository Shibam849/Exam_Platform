require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/questions",require("./routes/questions"));
app.use("/api/exams",    require("./routes/exams"));
app.use("/api/teacher",  require("./routes/teacher"));
app.use("/api/student",  require("./routes/student"));
app.use("/api/admin",    require("./routes/admin"));
app.use("/api/ai",       require("./routes/ai"));

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server Error" });
});

// Socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("joinRoom", (room) => socket.join(room));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
