export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'owner' | 'admin' | 'viewer'
          avatar_url: string | null
          preferred_currency: string
          email_notifications: boolean
          browser_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          role?: 'owner' | 'admin' | 'viewer'
          avatar_url?: string | null
          preferred_currency?: string
          email_notifications?: boolean
          browser_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          role?: 'owner' | 'admin' | 'viewer'
          avatar_url?: string | null
          preferred_currency?: string
          email_notifications?: boolean
          browser_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investment_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          investor_name: string
          principal_amount: number
          starting_date: string
          due_date: string
          category_id: string | null
          duration: 'annual' | 'semi_annual' | 'quarterly' | 'monthly'
          profit_rate: number
          commission_rate: number
          profit_amount: number
          commission_amount: number
          total_payout: number
          status: 'active' | 'matured' | 'renewed' | 'withdrawn'
          is_shared: boolean
          alert_dismissed: boolean
          is_profit_delivered: boolean
          notes: string | null
          user_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          investor_name: string
          principal_amount: number
          starting_date: string
          due_date: string
          category_id?: string | null
          duration: 'annual' | 'semi_annual' | 'quarterly' | 'monthly'
          profit_rate: number
          commission_rate: number
          profit_amount?: number
          commission_amount?: number
          total_payout?: number
          status?: 'active' | 'matured' | 'renewed' | 'withdrawn'
          is_shared?: boolean
          alert_dismissed?: boolean
          is_profit_delivered?: boolean
          notes?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          investor_name?: string
          principal_amount?: number
          starting_date?: string
          due_date?: string
          category_id?: string | null
          duration?: 'annual' | 'semi_annual' | 'quarterly' | 'monthly'
          profit_rate?: number
          commission_rate?: number
          profit_amount?: number
          commission_amount?: number
          total_payout?: number
          status?: 'active' | 'matured' | 'renewed' | 'withdrawn'
          is_shared?: boolean
          alert_dismissed?: boolean
          is_profit_delivered?: boolean
          notes?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_investors: {
        Row: {
          id: string
          investment_id: string
          investor_name: string
          share_percentage: number
          share_principal: number
          share_profit: number
          share_commission: number
          share_total_payout: number
          custom_commission_rate: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          investment_id: string
          investor_name: string
          share_percentage: number
          share_principal: number
          share_profit: number
          share_commission: number
          share_total_payout: number
          custom_commission_rate?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          investment_id?: string
          investor_name?: string
          share_percentage?: number
          share_principal?: number
          share_profit?: number
          share_commission?: number
          share_total_payout?: number
          custom_commission_rate?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          creditor_name: string
          debtor_name: string
          principal_amount: number
          currency: string
          issue_date: string
          due_date: string | null
          interest_rate: number | null
          total_due: number
          status: 'pending' | 'partial' | 'paid' | 'defaulted' | 'forgiven'
          amount_paid: number
          remaining_amount: number
          debt_type: 'personal' | 'trust' | 'business' | 'loan'
          notes: string | null
          user_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creditor_name: string
          debtor_name: string
          principal_amount: number
          currency?: string
          issue_date: string
          due_date?: string | null
          interest_rate?: number | null
          total_due?: number
          status?: 'pending' | 'partial' | 'paid' | 'defaulted' | 'forgiven'
          amount_paid?: number
          remaining_amount?: number
          debt_type?: 'personal' | 'trust' | 'business' | 'loan'
          notes?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creditor_name?: string
          debtor_name?: string
          principal_amount?: number
          currency?: string
          issue_date?: string
          due_date?: string | null
          interest_rate?: number | null
          total_due?: number
          status?: 'pending' | 'partial' | 'paid' | 'defaulted' | 'forgiven'
          amount_paid?: number
          remaining_amount?: number
          debt_type?: 'personal' | 'trust' | 'business' | 'loan'
          notes?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debt_payments: {
        Row: {
          id: string
          debt_id: string
          amount: number
          payment_date: string
          payment_method: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          amount: number
          payment_date?: string
          payment_method?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
      }
      investment_transactions: {
        Row: {
          id: string
          investment_id: string
          action_type: 'payout_profit' | 'add_capital' | 'withdraw_partial'
          amount: number
          transaction_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          investment_id: string
          action_type: 'payout_profit' | 'add_capital' | 'withdraw_partial'
          amount: number
          transaction_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          investment_id?: string
          action_type?: 'payout_profit' | 'add_capital' | 'withdraw_partial'
          amount?: number
          transaction_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          entity_type: 'investment' | 'debt'
          entity_id: string
          notification_type: 'maturity_30_days' | 'maturity_7_days' | 'maturity_1_day' | 'maturity_today' | 'overdue' | 'payment_received'
          scheduled_date: string
          sent_at: string | null
          is_sent: boolean
          recipient_email: string
          subject: string
          body: string
          error_message: string | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'investment' | 'debt'
          entity_id: string
          notification_type: 'maturity_30_days' | 'maturity_7_days' | 'maturity_1_day' | 'maturity_today' | 'overdue' | 'payment_received'
          scheduled_date: string
          sent_at?: string | null
          is_sent?: boolean
          recipient_email: string
          subject: string
          body: string
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'investment' | 'debt'
          entity_id?: string
          notification_type?: 'maturity_30_days' | 'maturity_7_days' | 'maturity_1_day' | 'maturity_today' | 'overdue' | 'payment_received'
          scheduled_date?: string
          sent_at?: string | null
          is_sent?: boolean
          recipient_email?: string
          subject?: string
          body?: string
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
