import { fetch } from "@tauri-apps/plugin-http";

export async function deeplTranslate(text: string, from: Language, to: Language) {
  const url = "https://www2.deepl.com/jsonrpc";
  const rand = getRandomNumber();
  const body = {
    jsonrpc: "2.0",
    method: "LMT_handle_texts",
    params: {
      splitting: "newlines",
      lang: {
        source_lang_user_selected: from !== "auto" ? from.slice(0, 2) : "auto",
        target_lang: to.slice(0, 2),
      },
      texts: [{ text, requestAlternatives: 3 }],
      timestamp: getTimeStamp(getICount(text)),
    },
    id: rand,
  };

  let body_str = JSON.stringify(body);

  if ((rand + 5) % 29 === 0 || (rand + 3) % 13 === 0) {
    body_str = body_str.replace('"method":"', '"method" : "');
  } else {
    body_str = body_str.replace('"method":"', '"method": "');
  }

  let res = await fetch(url, {
    method: "POST",
    body: body_str,
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    let result = await res.json();
    console.log(JSON.stringify(result));
    if (result && result.result && result.result.texts) {
      return result.result.texts[0].text.trim();
    } else {
      throw JSON.stringify(result);
    }
  } else {
    console.log(await res.json());
    // if (await res.json()) {
    //     throw `Status Code: ${res.status}\n${res.data.error.message}`;
    // } else {
    //     throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    // }
  }
}

export enum Language {
  auto = "auto",
  zh_cn = "ZH",
  zh_tw = "ZH",
  ja = "JA",
  en = "EN",
  ko = "KO",
  fr = "FR",
  es = "ES",
  ru = "RU",
  de = "DE",
  it = "IT",
  tr = "TR",
  pt_pt = "PT-PT",
  pt_br = "PT-BR",
  id = "ID",
  sv = "SV",
  pl = "PL",
  nl = "NL",
  uk = "UK",
}

function getRandomNumber() {
  const rand = Math.floor(Math.random() * 99999) + 100000;
  return rand * 1000;
}

function getTimeStamp(iCount: number) {
  const ts = Date.now();
  if (iCount !== 0) {
    iCount = iCount + 1;
    return ts - (ts % iCount) + iCount;
  } else {
    return ts;
  }
}

function getICount(translate_text: string) {
  return translate_text.split("i").length - 1;
}
