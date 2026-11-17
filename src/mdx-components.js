import Ref from '@/components/Ref';
import Radar from '@/components/Radar';
import Playground from '@/components/Playground';
import { slug, text } from '@/lib/text';

// Headings get the ids the post's CONTENTS links to; <Ref/>, <Radar/> and <Playground/> are usable in every post without an import.
const heading = (Tag) => function Heading({ children }) {
  return <Tag id={slug(text(children))}>{children}</Tag>;
};

const components = { h2: heading('h2'), h3: heading('h3'), Ref, Radar, Playground };

export function useMDXComponents() {
  return components;
}
