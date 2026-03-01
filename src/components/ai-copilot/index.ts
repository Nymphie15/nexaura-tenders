import dynamic from 'next/dynamic';

export const ChatInterface = dynamic(
  () => import('./chat-interface').then((mod) => mod.ChatInterface),
  { ssr: false }
);

export { ContextPanel } from './context-panel';
export { QuickActions } from './quick-actions';
export type { ChatMessage, ChatSource } from './chat-interface';
export type { ContextSource, ContextSearch } from './context-panel';
export type { QuickAction } from './quick-actions';
