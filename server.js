
import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "./config/db.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

// Verify the session secret before starting the server.
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing from .env");
}

// Request parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL session store
const PgSession = connectPgSimple(session);

const sessionStore = new PgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true
});

// Session configuration — local HTTP testing only.
app.use(session({
    store: sessionStore,
    name: "inventory.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 30
    }
}));

// Login page
app.get("/login", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.sendFile(path.join(publicDir, "login.html"));
});

// Login
app.post("/login", async (req, res, next) => {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username ||
        !password ||
        username.length > 100 ||
        password.length > 1024
    ) {
        return res.status(400).send("Invalid username or password.");
    }

    try {
        const result = await pool.query(
            `SELECT id, username, password_hash, role
             FROM users
             WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).send(
                'Login failed. <a href="/login">Try again</a>.'
            );
        }

        // Regenerate the session ID after successful authentication.
        req.session.regenerate((error) => {
            if (error) {
                return next(error);
            }

            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;

            req.session.save((saveError) => {
                if (saveError) {
                    return next(saveError);
                }

                res.redirect("/");
            });
        });
    } catch (error) {
        next(error);
    }
});

// Logout
app.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie("inventory.sid", {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        res.redirect("/login");
    });
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        if (req.path === "/equipment") {
            return res.status(401).json({
                error: "Authentication required."
            });
        }

        return res.redirect("/login");
    }

    next();
}

// Protect the application and its API routes.
app.use(requireAuth);

// Serve CSS after authentication.
// The login page uses the same CSS, so allow its stylesheet separately.
app.use("/css", express.static(path.join(publicDir, "css")));

// Inventory API — authenticated users only
app.get("/equipment", async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, brand, device_type, serial_number,
                    service_tag, assigned_to
             FROM equipment
             ORDER BY id DESC`
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// Add equipment — authenticated users only
app.post("/equipment", async (req, res, next) => {
    const {
        brand,
        deviceType,
        serialNumber,
        serviceTag,
        assignedTo
    } = req.body;

    if (
        typeof brand !== "string" ||
        typeof deviceType !== "string" ||
        typeof serialNumber !== "string" ||
        typeof assignedTo !== "string" ||
        (serviceTag !== undefined && typeof serviceTag !== "string") ||
        !brand.trim() ||
        !serialNumber.trim() ||
        !assignedTo.trim() ||
        !["monitor", "docking_station"].includes(deviceType)
    ) {
        return res.status(400).send("Invalid equipment data.");
    }

    try {
        await pool.query(
            `INSERT INTO equipment
                (brand, device_type, service_tag, serial_number, assigned_to)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                brand.trim(),
                deviceType,
                serviceTag?.trim() || null,
                serialNumber.trim(),
                assignedTo.trim()
            ]
        );

        res.status(201).send("Equipment added successfully!");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).send(
                "This serial number is already registered!"
            );
        }

        next(error);
    }
});

// Serve the main page only after authentication.
app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

// Serve JavaScript and other static assets only after authentication.
app.use(express.static(publicDir));

// Central error handler
app.use((error, req, res, next) => {
    console.error("Request failed:", error.message);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).send("An unexpected server error occurred.");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
