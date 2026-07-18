import { afterEach, describe, expect, it, vi } from "vitest";
import { convertToCSV, exportToCsv } from "./export";

function decodeCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index++) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && character === "\r" && csv[index + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      index++;
    } else {
      cell += character;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

describe("convertToCSV", () => {
  it("always quotes cells, uses CRLF, and guards spreadsheet formulas", () => {
    const csv = convertToCSV([
      {
        plain: "alpha",
        comma: "a,b",
        quote: 'a"b',
        carriageReturn: "a\rb",
        lineFeed: "a\nb",
        formulaAfterWhitespace: "  =SUM(A1:A2)",
        plus: "+1",
        minus: "-1",
        at: "@name",
        nullish: null,
        missingLater: "present",
        number: 42,
        unicode: "你好 مرحبا 😀",
      },
      {
        plain: "second",
        comma: undefined,
        quote: "",
        carriageReturn: "",
        lineFeed: "",
        formulaAfterWhitespace: "safe",
        plus: "safe",
        minus: "safe",
        at: "safe",
        nullish: undefined,
        number: 0,
        unicode: "é",
        extraIgnored: "not in first-row schema",
      },
    ]);

    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"a""b"');
    expect(csv).toContain('"\'  =SUM(A1:A2)"');
    expect(csv).not.toMatch(/(?<!\r)\n"second"/);
    expect(decodeCsv(csv)).toEqual([
      [
        "plain",
        "comma",
        "quote",
        "carriageReturn",
        "lineFeed",
        "formulaAfterWhitespace",
        "plus",
        "minus",
        "at",
        "nullish",
        "missingLater",
        "number",
        "unicode",
      ],
      [
        "alpha",
        "a,b",
        'a"b',
        "a\rb",
        "a\nb",
        "'  =SUM(A1:A2)",
        "'+1",
        "'-1",
        "'@name",
        "",
        "present",
        "42",
        "你好 مرحبا 😀",
      ],
      [
        "second",
        "",
        "",
        "",
        "",
        "safe",
        "safe",
        "safe",
        "safe",
        "",
        "",
        "0",
        "é",
      ],
    ]);
  });

  it("quotes and guards headers and emits exact CRLF row separators", () => {
    expect(convertToCSV([{ "=header": "=1", normal: "ok" }])).toBe(
      '"\'=header","normal"\r\n"\'=1","ok"',
    );
    expect(convertToCSV([{ value: "x" }, { value: "y" }])).toBe(
      '"value"\r\n"x"\r\n"y"',
    );
  });
});

describe("exportToCsv", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("clicks one download and revokes its Blob URL on the next task", () => {
    vi.useFakeTimers();
    const link = {
      download: "",
      style: { visibility: "" },
      setAttribute: vi.fn(),
      click: vi.fn(),
    };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { appendChild, removeChild },
    });
    const createObjectURL = vi.fn(() => "blob:csv");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    exportToCsv([{ value: "safe" }], "export.csv");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(link.setAttribute).toHaveBeenCalledWith("download", "export.csv");
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
  });
});
