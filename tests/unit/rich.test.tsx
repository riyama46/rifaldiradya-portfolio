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

  it("renders <hl> and <dim> as styled spans", () => {
    const nodes = richText("Launch in <hl>Days</hl>, <dim>Not Weeks</dim>");
    expect(nodes[0]).toBe("Launch in ");

    const hl = asElement(nodes[1]);
    expect(hl.type).toBe("span");
    expect(hl.props.className).toBe("hl");
    expect(hl.props.children).toBe("Days");

    expect(nodes[2]).toBe(", ");

    const dim = asElement(nodes[3]);
    expect(dim.type).toBe("span");
    expect(dim.props.className).toBe("dim");
    expect(dim.props.children).toBe("Not Weeks");
  });

  it("renders <mark> and <strong> as native elements", () => {
    const nodes = richText("a <mark>key</mark> and <strong>bold</strong> end");
    expect(asElement(nodes[1]).type).toBe("mark");
    expect(asElement(nodes[3]).type).toBe("strong");
    expect(nodes[4]).toBe(" end");
  });

  it("gives every element a unique key", () => {
    const keys = richText("<mark>a</mark> <mark>b</mark> <hl>c</hl>")
      .filter(isValidElement)
      .map((node) => node.key);
    expect(new Set(keys).size).toBe(3);
  });

  it("leaves unknown or unbalanced tags as literal text", () => {
    expect(richText("<script>alert(1)</script>")).toEqual(["<script>alert(1)</script>"]);
    expect(richText("<hl>open only")).toEqual(["<hl>open only"]);
  });
});
