import { createClient } from '@supabase/supabase-js';

// Reemplaza estas variables con tus credenciales de Supabase
// Las encuentras en Project Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ ERROR: Supabase credentials not found in env variables!");
} else {
    console.log("✅ Supabase initialized for URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10
        },
        // Intentar reconectar automáticamente si el WebSocket se cierra
        config: {
            reconnectAfterMs: (parseInt) => [1000, 2000, 5000, 10000][parseInt] || 10000,
        }
    }
});
