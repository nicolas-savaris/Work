import express from "express";
import pool from "./config/db.js";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/equipment", async (req, res) => {
    const serialNumber = req.body.serialNumber;
    const serviceTag = req.body.serviceTag;
    const brand = req.body.brand;
    const deviceType = req.body.deviceType;
    const assignedTo = req.body.assignedTo;


    console.log({ brand, deviceType, serialNumber, assignedTo });
    
    try {
        await pool.query(
            "INSERT INTO equipment (brand, device_type, service_tag, serial_number, assigned_to) VALUES ($1, $2, $3, $4, $5)",
            [brand, deviceType, serviceTag || null, serialNumber, assignedTo]
        )
        res.status(201).send("Equipment added successfully!");
    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            // Qui gestiremo il seriale duplicato
            res.status(409).send("This serial number is already registered!");
        } else {
            // Qui gestiremo gli altri errori
            res.status(500).send("Equipment not added!");
        }
    }
});

app.listen(3000, ()=> {
    console.log("Server is running on port 3000");
});