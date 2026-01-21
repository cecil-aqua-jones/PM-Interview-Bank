"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from "@codemirror/language";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { SupportedLanguage } from "@/lib/types";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  readOnly?: boolean;
  height?: string;
  className?: string;
  placeholder?: string;
};

const getLanguageExtension = (lang: SupportedLanguage) => {
  switch (lang) {
    case "python":
      return python();
    case "javascript":
      return javascript();
    case "java":
      return java();
    case "cpp":
      return cpp();
    case "go":
      return go();
    default:
      return python();
  }
};

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
  className = "",
  placeholder = "// Write your solution here..."
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalUpdate = useRef(false);
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      autocompletion(),
      syntaxHighlighting(defaultHighlightStyle),
      oneDark,
      getLanguageExtension(language),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        indentWithTab
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate.current) {
          const newValue = update.state.doc.toString();
          onChangeRef.current(newValue);
        }
      }),
      EditorView.theme({
        "&": {
          height,
          fontSize: "14px",
          fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', monospace"
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "inherit"
        },
        ".cm-content": {
          caretColor: "#fff",
          padding: "12px 0"
        },
        ".cm-gutters": {
          backgroundColor: "#1e1e1e",
          borderRight: "1px solid #333",
          color: "#6e6e6e"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "#2a2a2a"
        },
        ".cm-activeLine": {
          backgroundColor: "#2a2a2a40"
        },
        ".cm-selectionBackground": {
          backgroundColor: "#3a3a3a !important"
        },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "#264f78 !important"
        },
        ".cm-cursor": {
          borderLeftColor: "#fff"
        },
        ".cm-placeholder": {
          color: "#6e6e6e",
          fontStyle: "italic"
        }
      }),
      EditorView.editable.of(!readOnly),
      EditorState.readOnly.of(readOnly)
    ];

    // Add placeholder if provided
    if (placeholder && !value) {
      extensions.push(
        EditorView.contentAttributes.of({ "aria-placeholder": placeholder })
      );
    }

    const state = EditorState.create({
      doc: value,
      extensions
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly, height]); // Don't include value/onChange to avoid recreation

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isInternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value
        }
      });
      isInternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={`code-editor-container ${className}`}
      style={{
        height: "100%",
        minHeight: 0,
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #333",
        backgroundColor: "#1e1e1e",
        display: "flex",
        flexDirection: "column"
      }}
    />
  );
}
