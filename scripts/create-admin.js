
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD in your environment.");
    process.exitCode = 1;
} else {
    try {
        const passwordHash = await bcrypt.hash(password, 12);

        await pool.query(
            `INSERT INTO users (username, password_hash, role)
             VALUES ($1, $2, 'admin')
             ON CONFLICT (username) DO NOTHING`,
            [username, passwordHash]
        );

        console.log("Admin account creation completed.");
    } catch (error) {
        console.error("Unable to create admin account.");
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
