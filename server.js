const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 32) {
  console.log("JWT_SECRET is missing or too short (32 characters minimum)");
  process.exit(1);
}

const dataFolder = path.join(__dirname, "data");
const usersFile = path.join(dataFolder, "users.json");

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]");
}

function getUsers() {
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

const fakeHash = bcrypt.hashSync("some-random-password", 12);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, try again later" }
});

app.use(express.json({ limit: "10kb" }));

app.get(["/", "/acc.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "acc.html"));
});

app.get("/app.js", (req, res) => {
  res.sendFile(path.join(__dirname, "app.js"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

function checkToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.post("/api/signup", limiter, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3-30 letters, numbers or _" });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Password must be between 8 and 72 characters" });
  }

  const users = getUsers();
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const hash = await bcrypt.hash(password, 12);
  const lastUser = users[users.length - 1];

  users.push({
    id: lastUser ? lastUser.id + 1 : 1,
    username: username,
    password: hash,
    role: "user"
  });
  saveUsers(users);

  res.status(201).json({ message: "Account created" });
});

app.post("/api/login", limiter, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  const user = getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  const match = await bcrypt.compare(password, user ? user.password : fakeHash);

  if (!user || !match) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );

  res.json({ token });
});

app.get("/api/me", checkToken, (req, res) => {
  res.json({
    id: req.user.sub,
    username: req.user.username,
    role: req.user.role
  });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});