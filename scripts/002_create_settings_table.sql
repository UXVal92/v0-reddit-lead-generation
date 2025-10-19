-- Create settings table to store user preferences
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default prompt
INSERT INTO settings (key, value)
VALUES (
  'ai_prompt',
  'You are an expert at identifying Reddit posts where people are asking for financial advice and would benefit from professional financial advisory services. Focus on posts where someone is:

- Seeking guidance on complex financial decisions (retirement planning, investments, tax strategy)
- Facing major life financial transitions (inheritance, divorce, career change)
- Confused about financial products or strategies
- Looking for personalized financial planning
- Dealing with significant assets or income that requires professional management

The AI will analyze each post and provide:
1. A summary of their financial situation
2. A lead score (1-10) based on complexity and need
3. A professional reply draft positioning you as a financial adviser'
)
ON CONFLICT (key) DO NOTHING;
