// server.js
// Import necessary modules
const express = require('express'); // Express.js for creating the server
const bodyParser = require('body-parser'); // body-parser to handle request bodies
const fs = require('fs'); // File system module to read and write files

const app = express(); // Create an Express application

const PORT = 3000; // Define the port the server will listen on (you can change this)
const USERS_FILE = 'users.json'; // Define the file to store user data

// Middleware to serve static files from the 'public' directory
// This will serve your index.html and other static assets
app.use(express.static('public'));

// Middleware to parse URL-encoded bodies (for form data)
app.use(bodyParser.urlencoded({ extended: false }));
// Middleware to parse JSON bodies (for JSON data, though not directly used in this example for forms)
app.use(bodyParser.json());

// --- Signup Endpoint ---
app.post('/signup', (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    // Read existing users from users.json file
    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        let users = []; // Initialize users array
        if (!err) { // If no error reading the file
            try {
                users = JSON.parse(data); // Try to parse existing user data from JSON
            } catch (parseError) {
                console.error('Error parsing users.json:', parseError);
                // If parsing fails (e.g., empty or invalid JSON), start with an empty array
                users = [];
            }
        } else if (err.code !== 'ENOENT') { // If error is not "File Not Found"
            console.error('Error reading users.json:', err);
            return res.status(500).send('Failed to read user data.');
        }

        // Check if user with this email already exists
        const userExists = users.some(user => user.email === email);
        if (userExists) {
            return res.status(409).send('Email already registered. Please use a different email or login.');
        }

        // Create a new user object with email, password, and timestamp
        const newUser = {
            email: email,
            password: password, // IMPORTANT: In a real application, you should hash the password!
            timestamp: new Date().toISOString() // Add a timestamp for when the user signed up
        };

        users.push(newUser); // Add the new user to the users array

        // Write the updated users array back to users.json
        fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing to users.json:', writeErr);
                return res.status(500).send('Signup failed. Could not save user data.');
            }
            console.log(`User signed up: ${email}`);
            res.send('Signup successful!'); // Send success response to the client
        });
    });
});

// --- Login Endpoint ---
app.post('/login', (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    // Read users from users.json file
    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If file not found, it means no users are registered yet, so login fails
                return res.status(401).send('Login failed: No users registered.');
            } else {
                console.error('Error reading users.json:', err);
                return res.status(500).send('Failed to read user data.');
            }
        }

        let users = [];
        try {
            users = JSON.parse(data); // Parse user data from JSON
        } catch (parseError) {
            console.error('Error parsing users.json:', parseError);
            return res.status(500).send('Error processing user data.');
        }

        // Find a user that matches the provided email and password
        const user = users.find(u => u.email === email && u.password === password); // IMPORTANT: In real app, compare hashed passwords

        if (user) {
            console.log(`User logged in: ${email}`);
            res.send('Login successful!'); // Send success response
        } else {
            console.log(`Login failed for email: ${email}`);
            res.status(401).send('Login failed. Invalid credentials.'); // Send error response for invalid credentials
        }
    });
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`); // Log message when server starts
});

// IMPORTANT SECURITY NOTE:
// Passwords are currently stored in plain text in the users.json file.
// **THIS IS INSECURE FOR PRODUCTION APPLICATIONS.**
// For a real application, you MUST hash passwords before storing them.
// Consider using bcrypt or similar password hashing libraries.
