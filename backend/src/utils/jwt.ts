import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export interface JwtPayload {
  id: string;
  role: Role;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET belum diatur di environment");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET belum diatur di environment");
  }
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return { id: decoded.id, role: decoded.role, name: decoded.name };
}
