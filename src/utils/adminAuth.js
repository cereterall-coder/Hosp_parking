import { supabase } from "../supabase";

export const createSystemUser = async (username, password, role, additionalData = {}) => {
    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@hospital.local`;

    try {
        // En Supabase, si haces signUp te loguea automáticamente a menos que
        // uses el Service Role Key (que no es seguro en el cliente).
        // Por ahora, crearemos al usuario. El administrador tendrá que re-loguear
        // si el sistema lo saca, o podemos advertir esto.

        const { data: { user }, error: authError } = await supabase.auth.signUp({
            email: fakeEmail,
            password: password,
        });

        if (authError) throw authError;

        if (user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    username: username,
                    email: fakeEmail,
                    role: role,
                    created_at: new Date().toISOString(),
                    is_system_user: true,
                    on_shift: false,
                    is_disabled: false,
                    ...additionalData
                });

            if (dbError) throw dbError;
        }

        // Importante: No cerramos sesión aquí porque si el Admin está creando usuarios,
        // no queremos que se cierre su propia sesión (aunque signUp podría sobreescribirla).
        // NOTA: En Supabase real, para evitar esto se usa una Edge Function o el Service Role.

        return { success: true };

    } catch (error) {
        console.error("Error creating system user:", error);
        return { success: false, error: error.message };
    }
};
