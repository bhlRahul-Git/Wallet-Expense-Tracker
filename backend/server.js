// const express = require("express");
import express from "express"; // for this import/export syntax to work, we need to add "type": "module" in package.json
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config(); // loads environment variables from a .env file into process.env in a Node.js application

const app = express(); // create a new express app

// builtin middleware
// Middleware is a function that runs in the middle between the request and the response.
app.use(express.json());

// our custom simple middleware
// app.use((req, res, next) => {
//     console.log("Hey we hit a req, the method is:", req.method);
//     next();
// })

const PORT = process.env.PORT || 5001; // 5001 is the default port

async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;

    // DECIMAL(10,2)
    // means: a fixed-point number with:
    // 10 digits total
    // 2 digits after the decimal point
    // so: the max value it can store is 99999999.99 (8 digits before the decimal, 2 after)

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1); // status code 1 means failure, 0 means success
  }
}

app.get("/", (req, res) => {
  res.send("Its working 123"); // send a response
}); // route handler (http://localhost:5001/)

app.post("/api/transactions", async (req, res) => {
  // title, amount, category, user_id => these are gonna be undefined if we don't use the middleware express.json()
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transaction = await sql`
            INSERT INTO transactions (user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `;

    console.log("Transaction created successfully", transaction);

    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log("Error creating the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT); // once we listen to the PORT
  }); // listen to the PORT
});
