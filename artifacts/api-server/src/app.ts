import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { uploadsDir } from "./lib/uploads";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// origin: true reflects the request's Origin header, which — combined with
// credentials: true — lets the browser send/receive the session cookie when
// the web app and API run on different local dev ports.
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadsDir));
app.use("/api", router);

// Catches thrown errors from routes/middleware (Express 5 forwards both sync
// throws and rejected promises here automatically) — e.g. multer rejecting
// an oversized or non-image upload — and returns JSON instead of Express's
// default HTML error page.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, "Unhandled request error");
  const message = err instanceof Error ? err.message : "Something went wrong";
  res.status(400).json({ error: message });
});

export default app;
