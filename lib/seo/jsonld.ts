/**
 * Serializes JSON-LD for an HTML script element. Escaping `<` prevents an
 * attacker value such as `</script><script>alert(1)</script>` from ending the
 * JSON-LD script and injecting executable markup.
 */
export function serializeJsonLd(
  data: unknown,
): string {
  const serialized = JSON.stringify(data);

  if (serialized === undefined) {
    throw new TypeError(
      "JSON-LD data must be JSON-serializable.",
    );
  }

  return serialized
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
