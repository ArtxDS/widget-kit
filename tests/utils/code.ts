export function getGeneratedCode(container: ParentNode = document): string {
  return Array.from(container.querySelectorAll(".studio-code"))
    .map((element) => element.textContent ?? "")
    .join("\n");
}
