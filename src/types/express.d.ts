import { Request } from "express";
import { userType } from "@prisma/client";

declare namespace Express {
  export interface Request {
    user?: import("@prisma/client").User;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string | null;
        isVerified: boolean;
        userType: userType;
      };
    }
  }
}
