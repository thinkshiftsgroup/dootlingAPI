import { Request } from "express";
import { userType } from "@prisma/client";
import "express-session";

declare namespace Express {
  export interface Request {
    user?: import("@prisma/client").User;
  }
}

declare global {
  namespace Express {
    interface Request {
      files: FileGroups;
      body: FlatMilestoneBody;
    }
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

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    session?: import("express-session").Session &
      Partial<import("express-session").SessionData>;
    userId?: string;
  }
}
