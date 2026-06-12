import { resolveSportSrcEmbed } from "../src/embedResolve.js";

const url =
  "https://sport99.live/embed/?id=bac-ninh-fc-pvf-cong-an-nhan-dan-16316719&source=rapid";

const runs = await Promise.all(Array.from({ length: 4 }, () => resolveSportSrcEmbed(url)));
console.log(
  runs.map((r) => r.length),
  runs.every((r) => r.length > 0) ? "all ok" : "some failed"
);
