import pb from '@/lib/pocketbase/client'

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
  return pb.send<ParseOfxResponse>('/backend/v1/parse-ofx', {
    method: 'POST',
    body: JSON.stringify({ ofxContent }),
    headers: { 'Content-Type': 'application/json' },
  })
}
