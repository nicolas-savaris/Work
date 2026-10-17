import pool from "./db.js";

const result = await pool.query("SELECT 1");
console.log(result.rows);

await pool.end();