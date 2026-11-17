import Ref from '@/components/Ref';
import Radar from '@/components/Radar';
import Playground from '@/components/Playground';
import NpmDiff from '@/components/NpmDiff';
import YaraPlayground from '@/components/YaraPlayground';
import RiscvDisasm from '@/components/RiscvDisasm';
import { slug, text } from '@/lib/text';

// Headings get the ids the post's CONTENTS links to; <Ref/>, <Radar/>, <Playground/>, <NpmDiff/>, <YaraPlayground/> and <RiscvDisasm/> are usable in every post without an import.
const heading = (Tag) => function Heading({ children }) {
  return <Tag id={slug(text(children))}>{children}</Tag>;
};

const components = { h2: heading('h2'), h3: heading('h3'), Ref, Radar, Playground, NpmDiff, YaraPlayground, RiscvDisasm };

export function useMDXComponents() {
  return components;
}
