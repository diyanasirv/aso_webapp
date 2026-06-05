// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// small helper to mitigate navigator lock races in Supabase auth calls
export async function getUserWithRetry(retries = 3) {
	for (let i = 0; i < retries; i++) {
		try {
			return await supabase.auth.getUser();
		} catch (err) {
			if (i < retries - 1) await new Promise((r) => setTimeout(r, 300));
			else throw err;
		}
	}
}