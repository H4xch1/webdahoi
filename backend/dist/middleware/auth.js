import { verifyToken } from "../utils/jwt.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ message: "Token tidak valid atau expired" });
    }
}
