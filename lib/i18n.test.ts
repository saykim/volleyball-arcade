import { describe, expect, it } from "vitest";

import { MESSAGES } from "@/lib/i18n";

describe("i18n dictionaries", () => {
  it("keeps Korean and English keys aligned", () => {
    const koKeys = Object.keys(MESSAGES.ko).sort();
    const enKeys = Object.keys(MESSAGES.en).sort();
    expect(enKeys).toEqual(koKeys);
  });

  it("keeps Play Mode label in English for both locales", () => {
    expect(MESSAGES.ko["nav.playMode"]).toBe("Play Mode");
    expect(MESSAGES.en["nav.playMode"]).toBe("Play Mode");
    expect(MESSAGES.ko["playerMode.title"]).toBe("Play Mode");
    expect(MESSAGES.en["playerMode.title"]).toBe("Play Mode");
  });
});
