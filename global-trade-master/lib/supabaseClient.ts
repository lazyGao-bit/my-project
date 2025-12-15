import { createClient } from '@supabase/supabase-js'

// 直接把从网站复制来的地址填在这里 (注意要有引号)
const supabaseUrl = 'https://wfozgdrjvjyymbqeqpnf.supabase.co'

// 直接把 Key 填在这里 (注意要有引号)
const supabaseKey = 'sb_publishable_5-7Cb21B6SvVobpKc0Dmkg_uWSv2yeb'

export const supabase = createClient(supabaseUrl, supabaseKey)