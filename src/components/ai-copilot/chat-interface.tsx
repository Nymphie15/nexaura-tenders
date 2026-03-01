'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Bot,
  User,
  Sparkles,
  Check,
  Code2,
  FileCode,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  isStreaming?: boolean;
}

export interface ChatSource {
  id: string;
  title: string;
  url?: string;
  snippet: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, positive: boolean) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

// ============================================
// Syntax Highlighting Theme (Dark Mode Compatible)
// ============================================

const syntaxTheme = {
  keyword: 'text-purple-400',
  string: 'text-green-400',
  number: 'text-orange-400',
  comment: 'text-slate-500 italic',
  function: 'text-blue-400',
  variable: 'text-cyan-400',
  operator: 'text-pink-400',
  punctuation: 'text-slate-400',
  className: 'text-yellow-400',
  property: 'text-emerald-400',
};

// ============================================
// Simple Syntax Highlighter
// ============================================

function highlightCode(code: string, language: string): React.ReactNode[] {
  // Basic patterns for common languages
  const patterns: { [key: string]: Array<{ regex: RegExp; className: string }> } = {
    javascript: [
      { regex: /\/\/.*$/gm, className: syntaxTheme.comment },
      { regex: /\/\*[\s\S]*?\*\//g, className: syntaxTheme.comment },
      { regex: /(["'`])(?:(?!\1|\\).|\\.)*\1/g, className: syntaxTheme.string },
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g, className: syntaxTheme.keyword },
      { regex: /\b(\d+\.?\d*)\b/g, className: syntaxTheme.number },
      { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, className: syntaxTheme.className },
      { regex: /\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, className: syntaxTheme.function },
    ],
    typescript: [
      { regex: /\/\/.*$/gm, className: syntaxTheme.comment },
      { regex: /\/\*[\s\S]*?\*\//g, className: syntaxTheme.comment },
      { regex: /(["'`])(?:(?!\1|\\).|\\.)*\1/g, className: syntaxTheme.string },
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|interface|type|enum|implements|extends|public|private|protected)\b/g, className: syntaxTheme.keyword },
      { regex: /\b(\d+\.?\d*)\b/g, className: syntaxTheme.number },
      { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, className: syntaxTheme.className },
      { regex: /:\s*([a-zA-Z_][a-zA-Z0-9_<>[\]|&]*)/g, className: syntaxTheme.variable },
    ],
    python: [
      { regex: /#.*$/gm, className: syntaxTheme.comment },
      { regex: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, className: syntaxTheme.string },
      { regex: /(["'])(?:(?!\1|\\).|\\.)*\1/g, className: syntaxTheme.string },
      { regex: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|raise|pass|break|continue|in|is|not|and|or|True|False|None)\b/g, className: syntaxTheme.keyword },
      { regex: /\b(\d+\.?\d*)\b/g, className: syntaxTheme.number },
      { regex: /\bself\b/g, className: syntaxTheme.variable },
    ],
    sql: [
      { regex: /--.*$/gm, className: syntaxTheme.comment },
      { regex: /(["'])(?:(?!\1|\\).|\\.)*\1/g, className: syntaxTheme.string },
      { regex: /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|LIMIT|OFFSET|UNION|DISTINCT)\b/gi, className: syntaxTheme.keyword },
      { regex: /\b(\d+\.?\d*)\b/g, className: syntaxTheme.number },
    ],
    json: [
      { regex: /"([^"\\]|\\.)*"/g, className: syntaxTheme.string },
      { regex: /\b(true|false|null)\b/g, className: syntaxTheme.keyword },
      { regex: /\b(-?\d+\.?\d*)\b/g, className: syntaxTheme.number },
    ],
    bash: [
      { regex: /#.*$/gm, className: syntaxTheme.comment },
      { regex: /(["'])(?:(?!\1|\\).|\\.)*\1/g, className: syntaxTheme.string },
      { regex: /\$[a-zA-Z_][a-zA-Z0-9_]*/g, className: syntaxTheme.variable },
      { regex: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|awk|sed|chmod|chown|sudo)\b/g, className: syntaxTheme.keyword },
    ],
  };

  // Get language-specific patterns or use generic
  const langPatterns = patterns[language.toLowerCase()] || patterns.javascript;

  // For simplicity, return code with basic escaping
  // A full implementation would parse and apply styles
  const lines = code.split('\n');

  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      <span className="select-none text-slate-600 mr-4 inline-block w-8 text-right">
        {lineIndex + 1}
      </span>
      <span>{line}</span>
      {lineIndex < lines.length - 1 && '\n'}
    </React.Fragment>
  ));
}

// ============================================
// Code Block Component
// ============================================

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const languageIcons: Record<string, React.ReactNode> = {
    javascript: <FileCode className="w-3.5 h-3.5" />,
    typescript: <FileCode className="w-3.5 h-3.5" />,
    python: <Code2 className="w-3.5 h-3.5" />,
    sql: <Code2 className="w-3.5 h-3.5" />,
    bash: <Code2 className="w-3.5 h-3.5" />,
    json: <FileCode className="w-3.5 h-3.5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-xl overflow-hidden border border-slate-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          {languageIcons[language.toLowerCase()] || <Code2 className="w-3.5 h-3.5" />}
          <span className="text-xs font-mono text-slate-400">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs hover:bg-slate-700"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Copie!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 text-slate-400"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Code */}
      <pre className="bg-slate-900/95 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className="text-slate-100">
          {highlightCode(code, language)}
        </code>
      </pre>
    </motion.div>
  );
}

// ============================================
// Typing Indicator
// ============================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Markdown Renderer
// ============================================

function renderMarkdown(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  // Process code blocks first
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {processInlineMarkdown(textBefore)}
        </span>
      );
    }

    // Add code block
    const language = match[1] || 'text';
    const code = match[2].trim();
    parts.push(
      <CodeBlock key={`code-${match.index}`} code={code} language={language} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
        {processInlineMarkdown(remainingText)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [<span key="full" className="whitespace-pre-wrap">{content}</span>];
}

function processInlineMarkdown(text: string): React.ReactNode[] {
  // Split text by inline markdown patterns and return React elements
  const tokens: React.ReactNode[] = [];
  // Combined regex to match inline code, bold, italic, and links
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const segment = match[0];

    if (segment.startsWith('`')) {
      // Inline code
      const code = segment.slice(1, -1);
      tokens.push(
        <code key={`c-${keyIndex++}`} className="px-1.5 py-0.5 rounded bg-slate-700/50 text-emerald-400 text-sm font-mono">
          {code}
        </code>
      );
    } else if (segment.startsWith('**')) {
      // Bold
      const bold = segment.slice(2, -2);
      tokens.push(<strong key={`b-${keyIndex++}`} className="font-semibold">{bold}</strong>);
    } else if (segment.startsWith('*')) {
      // Italic
      const italic = segment.slice(1, -1);
      tokens.push(<em key={`i-${keyIndex++}`} className="italic">{italic}</em>);
    } else if (segment.startsWith('[')) {
      // Link
      const linkMatch = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a key={`a-${keyIndex++}`} href={linkMatch[2]} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : [text];
}

// ============================================
// Message Bubble Component
// ============================================

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (positive: boolean) => void;
}

function MessageBubble({ message, onCopy, onRegenerate, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0 shadow-lg">
        {isUser ? (
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted/80 dark:bg-slate-800/80 rounded-tl-sm'
        )}
      >
        <div className="text-sm leading-relaxed">
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <span className="whitespace-pre-wrap">{message.content}</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-0.5 h-5 bg-current"
              />
            </div>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs font-medium mb-2 opacity-70">Sources:</p>
            <div className="space-y-1.5">
              {message.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <span className="font-medium">{source.title}</span>
                  <p className="opacity-70 truncate mt-0.5">{source.snippet}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={cn(
          'text-xs mt-2 opacity-60',
          isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Actions */}
      <AnimatePresence>
        {showActions && !isUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-start gap-0.5 pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={onRegenerate}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => onFeedback?.(true)}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => onFeedback?.(false)}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ChatInterface({
  messages,
  onSendMessage,
  onRegenerate,
  onFeedback,
  isLoading = false,
  placeholder = 'Posez votre question...',
  className,
}: ChatInterfaceProps) {
  const [input, setInput] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <GlassCard
      variant="default"
      size="sm"
      animate={false}
      hover={false}
      className={cn('flex flex-col h-[600px]', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
            className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20"
          >
            <Sparkles className="w-5 h-5 text-violet-500" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Assistant IA</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'En train de reflechir...' : 'Pret a vous aider'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 rounded-full bg-primary/10 mb-4"
              >
                <Bot className="w-8 h-8 text-primary" />
              </motion.div>
              <h4 className="font-medium text-foreground mb-2">
                Comment puis-je vous aider ?
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Je suis votre assistant pour analyser les appels d&apos;offres,
                générer des documents et répondre à vos questions.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRegenerate={() => onRegenerate?.(message.id)}
                  onFeedback={(positive) => onFeedback?.(message.id, positive)}
                />
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Avatar className="w-8 h-8 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/80 dark:bg-slate-800/80 rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Button type="button" variant="ghost" size="sm" className="shrink-0 rounded-full">
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="pr-10 rounded-xl"
            />
          </div>

          <Button type="button" variant="ghost" size="sm" className="shrink-0 rounded-full">
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

export default ChatInterface;
