import { useDebounceFn } from 'ahooks';
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

type CustomElement = { type: 'paragraph'; children: CustomText[] };
type CustomText = { text: string; underline?: boolean };
type CustomRange = { anchor: Point; focus: Point; underline: true };

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

const original = `Yesterday moring, You are at the store. when you saw a good deal on milk, bread, and eggs, so you bought them. But they where expired. Your are very upst. Could not believe they sell old products?`;
const corrected = `Yesterday morning, you were at the store when you saw a good deal on milk, bread, and eggs, so you bought them. But they were expired. You are very upset. You could not believe they sell old products.`;
// const diff = diffWords(original, corrected);

const map = {
  [original as string]: corrected as string,
} as const;

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Yesterday moring, You are at the store. when you saw a good deal on milk, bread, and eggs, so you bought them. But they where expired. Your are very upst. Could not believe they sell old products?',
      },
    ],
  },
] satisfies Descendant[];

console.log(JSON.stringify(initialValue, null, 2));

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const decorate = ([node, path]: NodeEntry) => {
  if (!Element.isElementType(node, 'paragraph')) {
    return [];
  }
  const original = node.children.map((node) => node.text).join('');
  const corrected = map[original];

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
        underline: true,
      });
    }
    offset += item.value.length;
  }

  return ranges;
};

export default function App() {
  const editorRef = useRef(withReact(createEditor()));
  return (
    <div className="w-screen-md prose prose-truegray mx-auto text-base">
      <h1 className="">A slate writer demo</h1>
      <Slate editor={editorRef.current} initialValue={initialValue}>
        <Editable renderLeaf={Leaf} decorate={decorate} />
      </Slate>
    </div>
  );
}
