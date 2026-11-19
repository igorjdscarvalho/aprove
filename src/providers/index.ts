import type { ClientDataProvider } from './types';
import { mockClientProvider } from './mock/MockProvider';

// Provider padrão do protótipo. ClientEntry escolhe explicitamente o Supabase
// para slugs reais e mantém este provider para as rotas de demonstração.
export const clientProvider: ClientDataProvider = mockClientProvider;
