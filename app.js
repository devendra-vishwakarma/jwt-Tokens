import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mysql from "mysql2";
import jwt from "jsonwebtoken";
const app = express();

// Create a MySQL connection pool
const connectionsdb = mysql.createPool({
    user: "root",
    password: "root",
    database: "Login",
    host: "localhost",
    connectionLimit: 100
});

const JWT_SECRET = 'devendra';

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    console.log(token.split(" "));
    if (!token) return res.status(403).json({ auth: false, message: 'No token provided' });

    jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
        console.log(decoded,"this is my dexode");
        if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token' });

        // If everything is good, save to request for use in other routes
        req.userId = decoded.userId;
        next();
    });
}

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sign-up route
app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    const values = [username, email, password];
    // const token = jwt.sign({ username: result[0].username, userId: result[0].id }, JWT_SECRET, { expiresIn: '1h' });
    const token = jwt.sign(username, JWT_SECRET);
    console.log(token);
    connectionsdb.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error while signing up:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
        return res.status(201).json({ message: "User signed up successfully" , token:token});
    });
});


// Login route
app.post("/login",verifyToken, (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    const values = [username, password];

    connectionsdb.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error while logging in:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        if (result.length) {
            // const token = jwt.sign({ username: result[0].username, userId: result[0].id }, JWT_SECRET, { expiresIn: '1h' });
            // const token = jwt.sign(userData, secretKey, { expiresIn: '1h' });
            return res.status(200).json({ login: true, message: "Login successful"});
        } else {
            return res.status(401).json({ login: false, message: "Invalid credentials" });
        }
    });
});

// Start the server
const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
