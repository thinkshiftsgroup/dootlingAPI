import { NODE_ENV } from "@config/index";
const logger = {
  info: (...args: any[]) => {
    if (NODE_ENV !== "test") {
      console.log("INFO:", ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn("WARN:", ...args);
  },
  error: (...args: any[]) => {
    console.error("ERROR:", ...args);
  },
  debug: (...args: any[]) => {
    if (NODE_ENV === "development") {
      console.debug("DEBUG:", ...args);
    }
  },
};

export default logger;
