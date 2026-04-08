import { supabase } from '@/lib/supabase/client'

export interface ParsedTransaction {
  fitid: string
  date: string
  amount: number
  type: 'entrada' | 'saída'
  description: string
}

export interface ParseOfxResponse {
  account: {
    bankId: string
    acctId: string
  }
  transactions: ParsedTransaction[]
}

export const parseOfxFile = async (ofxContent: string): Promise<ParseOfxResponse> => {
  const { data, error } = await supabase.functions.invoke<ParseOfxResponse>('parse-ofx', {
    body: { ofxContent },
  })

  if (error) {
    throw error
  }

  return data
}
