-- Growth Agent OS — Database Schema

CREATE TABLE campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  app_url     TEXT NOT NULL,
  app_name    TEXT,
  niche       TEXT,
  platforms   TEXT[],
  goal        TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID REFERENCES campaigns ON DELETE CASCADE,
  agent_name   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  log_message  TEXT,
  output_json  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_pieces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID REFERENCES campaigns ON DELETE CASCADE,
  type         TEXT NOT NULL,
  platform     TEXT,
  content      TEXT,
  score        INTEGER,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE influencers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID REFERENCES campaigns ON DELETE CASCADE,
  username      TEXT,
  platform      TEXT,
  followers     INTEGER,
  engagement    FLOAT,
  niche_score   INTEGER,
  dm_message    TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_logs_campaign ON agent_logs(campaign_id);
CREATE INDEX idx_content_pieces_campaign ON content_pieces(campaign_id);
CREATE INDEX idx_influencers_campaign ON influencers(campaign_id);

-- Enable Realtime on agent_logs for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
