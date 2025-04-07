import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/supabase/functions/_shared/database"

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

export async function getShopApiKey(identifier: string): Promise<string | null> {
  try {
    // Call the RPC function to get the shop API key
    const { data, error } = await supabase.rpc("get_shop_api_key", { p_identifier: identifier }).single()

    if (error) {
      console.error("Error fetching shop API key:", error)
      return null
    }

    if (!data || !data.api_key) {
      console.error("No API key found for identifier:", identifier)
      return null
    }

    return data.api_key
  } catch (error) {
    console.error("Exception fetching shop API key:", error)
    return null
  }
}

