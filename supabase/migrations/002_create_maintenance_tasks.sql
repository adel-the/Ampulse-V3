-- ============================================
-- MAINTENANCE TASKS TABLE - To-Do List System
-- ============================================
-- This migration creates the maintenance tasks table for the hotel PMS
-- Based strictly on existing frontend modal fields

-- ============================================
-- MAINTENANCE TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id SERIAL PRIMARY KEY,
    
    -- Core task information (matching frontend modal exactly)
    titre TEXT NOT NULL,
    description TEXT,
    priorite TEXT CHECK (priorite IN ('faible', 'moyenne', 'haute', 'urgente')) DEFAULT 'moyenne',
    responsable TEXT,
    date_echeance DATE,
    notes TEXT,
    
    -- System fields
    statut TEXT CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')) DEFAULT 'en_attente',
    
    -- Relationships
    room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    
    -- Multi-tenancy: Tasks belong to hotel owner
    user_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Comments
COMMENT ON TABLE public.maintenance_tasks IS 'Maintenance tasks and to-do items for hotel rooms';
COMMENT ON COLUMN public.maintenance_tasks.titre IS 'Task title (required field from frontend modal)';
COMMENT ON COLUMN public.maintenance_tasks.priorite IS 'Task priority level';
COMMENT ON COLUMN public.maintenance_tasks.responsable IS 'Person responsible for the task';
COMMENT ON COLUMN public.maintenance_tasks.statut IS 'Current task status';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_maintenance_tasks_hotel ON public.maintenance_tasks(hotel_id);
CREATE INDEX idx_maintenance_tasks_room ON public.maintenance_tasks(room_id);
CREATE INDEX idx_maintenance_tasks_user_owner ON public.maintenance_tasks(user_owner_id);
CREATE INDEX idx_maintenance_tasks_statut ON public.maintenance_tasks(statut);
CREATE INDEX idx_maintenance_tasks_priorite ON public.maintenance_tasks(priorite);
CREATE INDEX idx_maintenance_tasks_date_echeance ON public.maintenance_tasks(date_echeance);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access tasks from their own hotels
CREATE POLICY "maintenance_tasks_tenant_isolation" ON public.maintenance_tasks
    FOR ALL 
    TO authenticated
    USING (user_owner_id = auth.uid())
    WITH CHECK (user_owner_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at timestamp
CREATE TRIGGER update_maintenance_tasks_updated_at 
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set completed_at when status changes to 'terminee'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'terminee' AND OLD.statut != 'terminee' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.statut != 'terminee' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER maintenance_tasks_set_completed_at
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION set_completed_at();