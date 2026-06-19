'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link as LinkIcon
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const getButtonClass = (isActive: boolean) => {
    return `p-2 rounded-lg transition-all ${
      isActive
        ? 'neu-pressed text-indigo-500 dark:text-indigo-400'
        : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:neu-pressed'
    }`;
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-white/5 z-10 sticky top-0">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={getButtonClass(editor.isActive('heading', { level: 1 }))}
        type="button"
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={getButtonClass(editor.isActive('heading', { level: 2 }))}
        type="button"
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={getButtonClass(editor.isActive('bold'))}
        type="button"
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={getButtonClass(editor.isActive('italic'))}
        type="button"
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={getButtonClass(editor.isActive('strike'))}
        type="button"
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={getButtonClass(editor.isActive('underline'))}
        type="button"
        title="Underline"
      >
        <UnderlineIcon size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={getButtonClass(editor.isActive({ textAlign: 'left' }))}
        type="button"
        title="Align Left"
      >
        <AlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={getButtonClass(editor.isActive({ textAlign: 'center' }))}
        type="button"
        title="Align Center"
      >
        <AlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={getButtonClass(editor.isActive({ textAlign: 'right' }))}
        type="button"
        title="Align Right"
      >
        <AlignRight size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={getButtonClass(editor.isActive('bulletList'))}
        type="button"
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={getButtonClass(editor.isActive('orderedList'))}
        type="button"
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={getButtonClass(editor.isActive('blockquote'))}
        type="button"
        title="Blockquote"
      >
        <Quote size={18} />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

      <button
        onClick={() => {
          const url = window.prompt('URL');
          if (url === null) return;
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
        className={getButtonClass(editor.isActive('link'))}
        type="button"
        title="Link"
      >
        <LinkIcon size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={getButtonClass(editor.isActive('highlight'))}
        type="button"
        title="Highlight"
      >
        <Highlighter size={18} />
      </button>

      <div className="flex-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
        type="button"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
        type="button"
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder = 'Write something brilliant...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-500 underline cursor-pointer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        className: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[220px] max-w-none p-6 text-slate-700 dark:text-gray-200',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-transparent rounded-xl overflow-hidden transition-all flex flex-col h-full">
      <MenuBar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {/* Custom CSS for Tiptap Placeholder */}
        <style jsx global>{`
          .is-editor-empty:first-child::before {
            color: #94a3b8;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .dark .is-editor-empty:first-child::before {
            color: #6b7280;
          }
        `}</style>
      </div>
    </div>
  );
}
