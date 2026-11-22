
import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const username = process.env.OPERATOR_USERNAME;
const password = process.env.OPERATOR_PASSWORD;

try {
    if (!username || !password) {
        throw new Error("Operator credentials are missing from .env");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
        `INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, 'operator')
         ON CONFLICT (username) DO NOTHING`,
        [username, passwordHash]
    );

    console.log("Operator test account created or already exists.");

} catch (error) {
    console.error("Unable to create operator account:", error.message);
    process.exitCode = 1;

} finally {
    await pool.end();
}
