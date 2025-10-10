import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_UNSAFE_DEFAULT_SECRET";

interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string | null;
    isVerified: boolean;
    userType: string;
  };
}

const handleTokenVerification = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
  userType?: "admin" | "superadmin"
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          isVerified: true,
          userType: true,
        },
      });

      if (!user) {
        res.status(401).json({ message: "Not authorized, user not found" });
        return;
      }

      req.user = user;

      if (userType) {
        if (
          (userType === "admin" &&
            (user.userType === "admin" || user.userType === "superadmin")) ||
          (userType === "superadmin" && user.userType === "superadmin")
        ) {
          next();
        } else {
          res.status(403).json({
            message: `Not authorized, requires ${userType} access`,
          });
        }
      } else {
        next();
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
    return;
  }
};

export const protect = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return handleTokenVerification(req, res, next);
};

export const adminProtect = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return handleTokenVerification(req, res, next, "admin");
};

export const superadminProtect = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return handleTokenVerification(req, res, next, "superadmin");
};

export const optionalProtect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          isVerified: true,
          userType: true,
        },
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Token verification failed (optional):", error);
    }
  }
  next();
};
