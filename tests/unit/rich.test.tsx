import { isValidElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { richText } from "@/i18n/rich";

type Props = { className?: string; children?: unknown };

function asElement(node: unknown): ReactElement<Props> {
  expect(isValidElement(node)).toBe(true);
  return node as ReactElement<Props>;
}

describe("richText", () => {
  it("returns plain text unchanged", () => {
    expect(richText("Just text")).toEqual(["Just text"]);
  });

  it("renders <em> as the accent word", () => {
    const nodes = richText("for <em>thousands.</em>");
    expect(nodes[0]).toBe("for ");

    const em = asElement(nodes[1]);
    expect(em.type).toBe("em");
    expect(em.props.className).toBe("ac");
    expect(em.props.children).toBe("thousands.");
  });

  it("renders <s> and <strong> as native elements", () => {
    const nodes = richText("instead of <s>five passwords.</s> and <strong>bold</strong> end");
    expect(asElement(nodes[1]).type).toBe("s");
    expect(asElement(nodes[3]).type).toBe("strong");
    expect(nodes[4]).toBe(" end");
  });

  it("gives every element a unique key", () => {
    const keys = richText("<em>a</em> <s>b</s> <strong>c</strong>")
      .filter(isValidElement)
      .map((node) => node.key);
    expect(new Set(keys).size).toBe(3);
  });

  it("leaves the v1 markers literal (no longer allowed)", () => {
    for (const text of ["<hl>Days</hl>", "<dim>Not Weeks</dim>", "<mark>key</mark>"]) {
      expect(richText(text)).toEqual([text]);
    }
  });

  it("leaves unknown or unbalanced tags as literal text", () => {
    expect(richText("<script>alert(1)</script>")).toEqual(["<script>alert(1)</script>"]);
    expect(richText("<em>open only")).toEqual(["<em>open only"]);
  });
});
