import { createLucideIcon } from 'lucide-react-native';

export const FilePdf = createLucideIcon('FilePdf', [
  [
    'path',
    {
      d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
      key: 'page',
    },
  ],
  ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5', key: 'fold' }],
  [
    'path',
    {
      d: 'M6.5 17v-5h1.25a1.25 1.25 0 0 1 0 2.5H6.5 M11 12h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1Z M16 17v-5h2.5 M16 14.5h2',
      strokeWidth: 1.3,
      key: 'pdf',
    },
  ],
]);
