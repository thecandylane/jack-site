// Maps describe where an object's properties live, the way V8's hidden classes do. They stay
// host-side, in a null-prototype array: a guest can never name a map, only hold a pointer to
// an object whose header names one. Transitioning an object to a new shape therefore means
// rewriting its mapId, never building a key from guest text.
//
// Slot 0 of every object is its prototype. Declared properties start at slot 1.

import { HEADER, SLOT } from './heap.js';

export const PROTO_SLOT = 0;
export const slotOffset = (index) => HEADER + index * SLOT;

export const KIND = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
  FUNC: 'func',
  HEAPNUM: 'heapnum',
  SINGLETON: 'singleton',
  VIEW: 'view',
  ELEMS: 'elems',
};

export class Maps {
  constructor() {
    this.list = [];
    this.byShape = new Map(); // host-built keys only: kind + property names the parser saw
  }

  define(spec) {
    const map = { id: this.list.length, kind: KIND.OBJECT, props: [], elemRep: 'smi', ...spec };
    map.props = map.props.map((p) => ({ key: p.key ?? p, rep: p.rep ?? 'tagged' }));
    this.list.push(map);
    return map.id;
  }

  get(id) {
    return this.list[id];
  }

  /** Slot index for a declared property, or -1. Linear: shapes are tiny by construction. */
  indexOf(mapId, key) {
    const props = this.list[mapId].props;
    for (let i = 0; i < props.length; i++) if (props[i].key === key) return i + 1;
    return -1;
  }

  /** The map an object takes when it gains `key`. Cached so two objects with one extra
   *  property share a shape, as V8's transition tree does. */
  withProp(mapId, key, rep) {
    const cacheKey = `${mapId}:${key}:${rep}`;
    const hit = this.byShape.get(cacheKey);
    if (hit !== undefined) return hit;
    const base = this.list[mapId];
    const id = this.define({
      kind: base.kind,
      elemRep: base.elemRep,
      props: [...base.props, { key, rep }],
    });
    this.byShape.set(cacheKey, id);
    return id;
  }

  /** The map an array takes when its element representation widens. */
  withElemRep(mapId, elemRep) {
    const cacheKey = `${mapId}:elem:${elemRep}`;
    const hit = this.byShape.get(cacheKey);
    if (hit !== undefined) return hit;
    const base = this.list[mapId];
    const id = this.define({ kind: base.kind, elemRep, props: base.props });
    this.byShape.set(cacheKey, id);
    return id;
  }

  /** Shape for an object literal: the parser already knows every key, so no transitions run. */
  shapeOf(kind, keys) {
    const cacheKey = `${kind}:${keys.join('\u0000')}`;
    const hit = this.byShape.get(cacheKey);
    if (hit !== undefined) return hit;
    const id = this.define({
      kind,
      props: keys.map((key) => ({ key, rep: 'tagged' })),
    });
    this.byShape.set(cacheKey, id);
    return id;
  }
}
