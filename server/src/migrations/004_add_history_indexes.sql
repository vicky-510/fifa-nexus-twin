-- History queries sort by created_at DESC and optionally filter by scenario /
-- stadium_id; without indexes each dashboard load is a full-table scan+sort.
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_scenario ON simulations (scenario, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_stadium_id ON simulations (stadium_id, created_at DESC);
