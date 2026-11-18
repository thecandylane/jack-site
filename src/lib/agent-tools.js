// WebMCP-shaped tool layer for the familiar's simulated agent.
//
// The model (and anything it reads, including pinned notes) can only emit a function call: a
// name and some arguments. It cannot mint a tool label or a capability. Those are host facts,
// held in TOOLS below: the label is derived from the site's own origin and the tool's name,
// and the capability is a short, host-defined string. The route builds an invocation with those
// host-minted values and hands it to mediate(), which re-checks the label, the capability, the
// tool name and the arguments before any UI tool is allowed to run.
//
// Deliberately dependency-free: no import of familiar.js (that would be circular), no network,
// no eval. Everything here is pure data plus pure functions, so it is unit-testable in isolation.

const ORIGIN = 'schliewesystems.com';

// A deterministic, host-derived label. The security does NOT come from this being secret: it
// comes from mediate() deriving it from ORIGIN + the tool's own name (both host constants),
// never from anything in the guest-controlled invocation. A caller cannot choose it.
function fingerprint(s) {
  let h = 2166136261; // FNV-1a-ish, stable across runs and isolates
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export function label(origin, name) {
  const id = `${origin}/${name}`;
  return `wmcp:${id}#${fingerprint(id)}`;
}

// Rules are plain data interpreted by passesSchema(). "enum" lists allowed values; "string"
// accepts any string (uiAction truncates for display, so no length is enforced here, which
// preserves uiAction's behaviour for valid calls).
const enumRule = (...values) => Object.freeze({ type: 'enum', values: Object.freeze(values) });
const stringRule = () => Object.freeze({ type: 'string' });

// TOOLS is an ARRAY, looked up with .find() and ===. It is never indexed with a
// guest-controlled string (no TOOLS[name]), so names like "__proto__", "constructor" or
// "toString" cannot reach object prototypes or pollute a host object.
export const TOOLS = Object.freeze([
  Object.freeze({
    name: 'ui_theme',
    origin: ORIGIN,
    capability: 'ui:theme',
    schema: Object.freeze({
      keys: Object.freeze([
        Object.freeze({ name: 'phosphor', required: true, rule: enumRule('p7', 'p12') }),
      ]),
    }),
  }),
  Object.freeze({
    name: 'ui_scroll',
    origin: ORIGIN,
    capability: 'ui:scroll',
    schema: Object.freeze({
      keys: Object.freeze([
        Object.freeze({ name: 'section', required: true, rule: enumRule('ref-radar', 'work', 'projects', 'about', 'security', 'writing', 'contact') }),
      ]),
    }),
  }),
  Object.freeze({
    name: 'ui_widget',
    origin: ORIGIN,
    capability: 'ui:widget',
    schema: Object.freeze({
      keys: Object.freeze([
        Object.freeze({ name: 'title', required: true, rule: stringRule() }),
        Object.freeze({ name: 'text', required: true, rule: stringRule() }),
      ]),
    }),
  }),
]);

function ruleAllows(rule, value) {
  if (rule.type === 'enum') return rule.values.includes(value); // array.includes, not object indexing
  if (rule.type === 'string') return typeof value === 'string';
  return false;
}

function passesSchema(schema, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return false;
  const defs = schema.keys;                 // host-controlled list of allowed keys
  const allowed = defs.map((d) => d.name); // host-controlled key names
  for (const key of Object.keys(args)) {
    if (!allowed.includes(key)) return false; // reject unknown / smuggled keys
  }
  for (const def of defs) {
    const has = Object.hasOwn(args, def.name);
    if (def.required && !has) return false;
    if (!has) continue;
    // def.name is a host key, never a guest string: safe to index the guest's args object.
    if (!ruleAllows(def.rule, args[def.name])) return false;
  }
  return true;
}

/**
 * The single mediated call path. Returns { ok: true, output } on success, or
 * { ok: false, refused } with a short reason. It never runs a tool and never mutates its input.
 */
export function mediate(invocation) {
  if (!invocation || typeof invocation !== 'object' || typeof invocation.tool !== 'string') {
    return { ok: false, refused: 'refused: bad invocation' };
  }
  // === only, never a guest-controlled string used as a property key on a host object.
  const tool = TOOLS.find((t) => t.name === invocation.tool);
  if (!tool) return { ok: false, refused: 'refused: unknown tool' };

  // Re-derive the expected label from HOST data. Nothing in the invocation can influence it.
  const expected = label(tool.origin, tool.name);
  if (invocation.label !== expected) return { ok: false, refused: 'refused: bad label' };
  if (invocation.capability !== tool.capability) return { ok: false, refused: 'refused: bad capability' };
  if (!passesSchema(tool.schema, invocation.args)) return { ok: false, refused: 'refused: bad arguments' };

  return { ok: true, output: 'done' };
}
