
import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

try {
    if (!username || !password) {
        throw new Error("Admin credentials are missing from .env");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `UPDATE users
         SET password_hash = $1, role = 'admin'
         WHERE username = $2
         RETURNING id`,
        [passwordHash, username]
    );

    if (result.rowCount === 0) {
        console.error("Admin user not found. Check ADMIN_USERNAME in .env.");
        process.exitCode = 1;
    } else {
        console.log("Admin password reset successfully.");
    }
} catch (error) {
    console.error("Unable to reset admin password.");
    process.exitCode = 1;
} finally {
    await pool.end();
}
