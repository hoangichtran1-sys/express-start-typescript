// import path from "node:path";
// import fs from "fs";
// import { pino } from "pino";

// const logDir = path.join(process.cwd(), "src/storage/log");
// if (!fs.existsSync(logDir)) {
//     fs.mkdirSync(logDir, { recursive: true });
// }

// const logger = pino({
//     name: "server start",
//     level: "info",
//     transport: {
//         targets: [
//             {
//                 target: "pino-pretty",
//                 options: { colorize: true },
//             },
//             {
//                 target: "pino/file",
//                 options: {
//                     destination: path.join(
//                         logDir,
//                         `express-${new Date().toISOString().split("T")[0]}.log`,
//                     ),
//                     mkdir: true,
//                     sync: false,
//                 },
//             },
//         ],
//     },
// });
