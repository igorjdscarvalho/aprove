import type { ClientDataProvider } from './types';
import { mockClientProvider } from './mock/MockProvider';

// Fase 7 trocará por um SupabaseProvider quando VITE_DATA_SOURCE=supabase.
// Por enquanto o lado do cliente usa sempre os dados de exemplo.
export const clientProvider: ClientDataProvider = mockClientProvider;
