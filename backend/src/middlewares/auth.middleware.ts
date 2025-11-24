import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string, role?: string};
    }
  }
}

export function auth(required = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
      if (!required) return next();
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId).select("role");
      req.user = { id: decoded.userId, role: user?.role };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
