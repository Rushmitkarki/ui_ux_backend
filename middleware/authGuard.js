const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error("Missing or malformed authorization header.");
            return res.status(401).json({ message: "Unauthorized: Missing token." });
        }

        const token = authHeader.split(" ")[1];
        console.log("Extracted Token:", token);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Payload:", decoded);

        // Attach decoded user info to request
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        return res.status(403).json({ message: "Forbidden: Invalid token." });
    }
};

module.exports = { authGuard };
