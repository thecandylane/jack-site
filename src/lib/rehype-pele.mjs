import { render } from 'pele';
import { fromHtml } from 'hast-util-from-html';

// Turns ```mermaid blocks into SVG while the site builds, so a post ships the finished drawing and no diagram
// script. Colors and fonts come from --pele-* variables in globals.css. A diagram that doesn't parse fails the build.

// Diagrams are set in JetBrains Mono, where every character is 0.6em wide, so boxes are sized to match it.
// ponytail: counts UTF-16 units, so wide (CJK) text would overflow; measure per character if that ever matters.
const mono = { width: (text, size) => text.length * size * 0.6 };
export default function rehypePele() {
  return (tree) => {
    let n = 0;
    const walk = (node) => {
      node.children?.forEach((child, i) => {
        const code = child.tagName === 'pre' && child.children?.[0];
        if (code?.tagName === 'code' && code.properties?.className?.includes('language-mermaid')) {
          const source = code.children.map((c) => c.value ?? '').join('');
          const { svg } = render(source, { measurer: mono, idPrefix: `d${n++}-` });
          node.children[i] = {
            type: 'element', tagName: 'figure', properties: { className: ['diagram'] },
            children: fromHtml(svg, { fragment: true, space: 'svg' }).children,
          };
        } else walk(child);
      });
    };
    walk(tree);
  };
}
