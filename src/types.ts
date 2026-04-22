export type BusinessStatus = 'wait_info' | 'invoicing' | 'collecting' | 'calculating' | 'filing' | 'paid' | 'manual';

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
  avatar: string;
}

export interface Message {
  id: string;
  sender: 'system' | 'customer' | 'bot';
  senderName: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  isInvoice?: boolean;
  image?: string;
  isReceipt?: boolean;
}

export interface TaxData {
  sales: number;
  purchases: number;
  vatRate: number;
  estimatedVat: number;
}
