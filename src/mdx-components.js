import Ref from '@/components/Ref';
import Radar from '@/components/Radar';
import { slug, text } from '@/lib/text';

// Headings get the ids the post's CONTENTS links to; <Ref/> and <Radar/> are usable in every post without an import.
const heading = (Tag) => function Heading({ children }) {
  return <Tag id={slug(text(children))}>{children}</Tag>;
};

const components = { h2: heading('h2'), h3: heading('h3'), Ref, Radar };

export function useMDXComponents() {
  return components;
}
