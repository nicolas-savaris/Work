
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

    const result = await pool.query(
        `UPDATE users
         SET password_hash = $1
         WHERE username = $2
         AND role = 'operator'
         RETURNING id`,
        [passwordHash, username]
    );

    if (result.rowCount === 0) {
        throw new Error("Operator account not found.");
    }

    console.log("Operator password updated successfully.");

} catch (error) {
    console.error("Unable to update operator password:", error.message);
    process.exitCode = 1;

} finally {
    await pool.end();
}
