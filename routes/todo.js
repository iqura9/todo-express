const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
async function createTodoTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.todo (
      key SERIAL PRIMARY KEY,
      value TEXT,
      status INTEGER
    )
  `;
  try {
    const client = await pool.connect();
    await client.query(createTableQuery);
    client.release();
  } catch (err) {
    console.error("Error creating todo table:", err);
  }
}
createTodoTable();

// GET all todos
router.get("/", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM public.todo");
    res.status(200).send(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching todos from the database");
  }
});

// POST create a new todo
router.post("/", async (req, res) => {
  const { value } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO public.todo (value, status) VALUES ($1, $2) RETURNING *",
      [value, 0]
    );
    res.status(201).send(result.rows[0]);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating a new todo");
  }
});

// PUT update an existing todo by ID
router.put("/:id", async (req, res) => {
  const todoId = req.params.id;
  const { value } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "UPDATE public.todo SET value = $1, status = $2 WHERE key = $3 RETURNING *",
      [value, 0, todoId]
    );

    if (result.rowCount === 0) {
      res.status(404).send("Todo not found");
    } else {
      res.send(result.rows[0]);
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating the todo");
  }
});

// DELETE delete an existing todo by ID
router.delete("/:id", async (req, res) => {
  const todoId = req.params.id;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "DELETE FROM public.todo WHERE key = $1 RETURNING *",
      [todoId]
    );

    if (result.rowCount === 0) {
      res.status(404).send("Todo not found");
    } else {
      res.send(result.rows[0]);
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting the todo");
  }
});

module.exports = router;
