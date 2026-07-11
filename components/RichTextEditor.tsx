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
    return `p-2 rounded-lg transition-all flex items-center justify-center ${
      isActive
        ? 'bg-[#2563EB]/10 text-[#2563EB]'
        : 'text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734]'
    }`;
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-3 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] z-10 sticky top-0">
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

      <div className="w-px h-6 bg-slate-200 dark:bg-[#232734] mx-1" />

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

      <div className="w-px h-6 bg-slate-200 dark:bg-[#232734] mx-1" />

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

      <div className="w-px h-6 bg-slate-200 dark:bg-[#232734] mx-1" />

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

      <div className="w-px h-6 bg-slate-200 dark:bg-[#232734] mx-1" />

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
        className="p-2 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        type="button"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
        className: 'prose prose-invert focus:outline-none min-h-[250px] max-w-none p-6 text-slate-900 dark:text-white leading-relaxed',
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
          .tiptap p.is-editor-empty:first-child::before {
            color: rgba(148, 163, 184, 0.5);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .tiptap {
            min-height: 250px;
          }
        `}</style>
      </div>
    </div>
  );
}
