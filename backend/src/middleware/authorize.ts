import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Belum login" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Tidak punya akses ke resource ini" });
    }
    next();
  };
}
