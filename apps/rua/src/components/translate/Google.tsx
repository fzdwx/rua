//@ts-nocheck
import { fetch } from "@tauri-apps/plugin-http";

export enum Language {
  auto = "auto",
  zh_cn = "zh-CN",
  zh_tw = "zh-TW",
  ja = "ja",
  en = "en",
  ko = "ko",
  fr = "fr",
  es = "es",
  ru = "ru",
  de = "de",
  it = "it",
  tr = "tr",
  pt_pt = "pt",
  pt_br = "pt",
  vi = "vi",
  id = "id",
  th = "th",
  ms = "ms",
  ar = "ar",
  hi = "hi",
  mn_cy = "mn",
  km = "km",
  nb_no = "no",
  nn_no = "no",
  fa = "fa",
  sv = "sv",
  pl = "pl",
  nl = "nl",
  uk = "uk",
  he = "he",
}

export async function translate(text: string, from: Language, to: Language) {
  const custom_url = "https://translate.googleapis.com";
  const data = {
    client: "gtx",
    sl: from,
    tl: to,
    hl: to,
    ie: "UTF-8",
    oe: "UTF-8",
    otf: "1",
    ssel: "0",
    tsel: "0",
    kc: "7",
    q: text,
  };

  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    parameters.append(key, value);
  }
  for (const v of ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"]) {
    parameters.append("dt", v);
  }
  try {
    let res = await fetch(`${custom_url}/translate_a/single?${parameters.toString()}`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    const result = await res.json();
    // 词典模式
    if (result[1]) {
      let target = { pronunciations: [], explanations: [], associations: [], sentence: [] };
      // 发音
      if (result[0][1][3]) {
        target.pronunciations.push({ symbol: result[0][1][3], voice: "" });
      }
      // 释义
      for (let i of result[1]) {
        target.explanations.push({
          trait: i[0],
          explains: i[2].map((x) => {
            return x[0];
          }),
        });
      }
      // 例句
      if (result[13]) {
        for (let i of result[13][0]) {
          target.sentence.push({ source: i[0] });
        }
      }
      return target;
    } else {
      // 翻译模式
      let target = "";
      for (let r of result[0]) {
        if (r[0]) {
          target = target + r[0];
        }
      }
      return target.trim();
    }
  } catch (error) {
    throw new Error(`Translation request failed: ${error}`);
  }
}
