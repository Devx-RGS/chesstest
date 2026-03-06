import jwt from "jsonwebtoken";

/**
 * verifyToken — validates JWT for regular authenticated routes.
 * Attaches decoded payload (with userId) to req.user.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

/**
 * verifyAdmin — validates JWT + checks isAdmin flag.
 * Attaches decoded payload to req.admin.
 */
/**
 * optionalVerifyToken — if a valid Bearer token is present, decodes it and
 * sets req.user. If no token or invalid token, the request continues without
 * req.user (the endpoint stays public).
 */
export const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(); // no token — continue as unauthenticated
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.SECRET_KEY);
    } catch (_err) {
        // invalid/expired token — continue without req.user
    }
    next();
};

export const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded.isAdmin) {
            return res.status(403).json({
                error: "Access denied",
                message: "Admin privileges required",
            });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token has expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
};
