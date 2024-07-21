import nlp from 'compromise';
import { diffWords } from 'diff';
import { useRef } from 'react';
import {
  BaseEditor,
  createEditor,
  Descendant,
  Element,
  NodeEntry,
  Point,
  Range,
} from 'slate';
import { withHistory } from 'slate-history';

type GrammarRecommend = {
  correction: string;
};

type CustomElement = { type: 'paragraph'; children: CustomText[] };
type CustomText = { text: string; grammar?: GrammarRecommend[] };
type CustomRange = {
  anchor: Point;
  focus: Point;
  grammar?: GrammarRecommend[];
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
    Range: CustomRange;
  }
}

import {
  Editable,
  ReactEditor,
  RenderLeafProps,
  Slate,
  withReact,
} from 'slate-react';

const original =
  'Yesterday moring, You are at the store. when you saw a good deal on milk, bread, and eggs, so you bought them. But they where expired. Your are very upst. Could not believe they sell old products?';

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: original,
      },
    ],
  },
] satisfies Descendant[];

console.log(nlp(original).sentences());

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.grammar) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const map = new Map([
  [
    '0',
    `Yesterday morning, you were at the store when you saw a good deal on milk, bread, and eggs, so you bought them. But they were expired. You are very upset. You could not believe they sell old products.`,
  ],
]);

const decorate = ([node, path]: NodeEntry) => {
  if (!Element.isElementType(node, 'paragraph')) {
    return [];
  }

  console.log('paragraph path', node, path);

  const original = node.children.map((node) => node.text).join('');
  const corrected = map.get(path.join('.'));

  const ranges: Range[] = [];

  if (!corrected) {
    return ranges;
  }

  const diff = diffWords(original, corrected);

  let offset = 0;
  for (let i = 0, len = diff.length; i < len; i++) {
    const item = diff[i];
    if (item.removed) {
      ranges.push({
        anchor: { path, offset },
        focus: { path, offset: offset + item.value.length },
        grammar: [],
      });
      offset += item.value.length;
      continue;
    }

    if (item.added) {
      ranges[ranges.length - 1].grammar?.push({
        correction: item.value,
      });
      continue;
    }

    offset += item.value.length;
  }

  return ranges;
};

export default function App() {
  const editorRef = useRef(withReact(withHistory(createEditor())));
  return (
    <div className="w-screen-md prose prose-truegray mx-auto text-base">
      <h1 className="">A slate writer demo</h1>
      <Slate editor={editorRef.current} initialValue={initialValue}>
        <Editable className="p-2" renderLeaf={Leaf} decorate={decorate} />
      </Slate>
    </div>
  );
}
