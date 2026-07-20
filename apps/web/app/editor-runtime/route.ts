import { renderEditorRuntimeDocument } from '@/lib/editor-runtime-document';

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(renderEditorRuntimeDocument(), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
