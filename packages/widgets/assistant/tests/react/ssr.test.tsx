// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantWidget } from "../../src";
import { MockTransport } from "../../src/transport";

describe("assistant widget server rendering", () => {
  it("renders the open panel without browser APIs", () => {
    const html = renderToStaticMarkup(
      <AssistantWidget
        defaultDisplayState="open"
        transport={new MockTransport({ script: "Server response" })}
      />,
    );

    expect(html).toContain('data-state="open"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Start a conversation");
    expect(html).toContain("wk-assistant__textarea");
  });

  it("renders the launcher by default", () => {
    const html = renderToStaticMarkup(
      <AssistantWidget transport={new MockTransport()} />,
    );

    expect(html).toContain('data-state="launcher"');
    expect(html).toContain("wk-assistant__launcher");
    expect(html).not.toContain('role="dialog"');
  });

  it("renders no launcher or panel when closed", () => {
    const html = renderToStaticMarkup(
      <AssistantWidget
        defaultDisplayState="closed"
        transport={new MockTransport()}
      />,
    );

    expect(html).toContain('data-state="closed"');
    expect(html).not.toContain("wk-assistant__launcher");
    expect(html).not.toContain('role="dialog"');
  });
});
