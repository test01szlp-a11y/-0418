export type BusinessStatus = 'wait_info' | 'invoicing' | 'collecting' | 'calculating' | 'filing' | 'paid';

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contact: string;
  status: BusinessStatus;
  progress: number; // 0-100
  docsReceived: {
    invoice: boolean;
    bank: boolean;
    salary: boolean;
  };
  lastMessage?: string;
}

export interface Message {
  id: string;
  sender: 'system' | 'customer' | 'bot';
  senderName: string;
  content: string;
  timestamp: Date;
}

export interface TaxData {
  sales: number;
  purchases: number;
  vatRate: number;
  estimatedVat: number;
}
