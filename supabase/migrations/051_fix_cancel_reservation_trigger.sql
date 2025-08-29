-- Migration: Fix cancel reservation trigger
-- Allow status changes to 'cancelled' and 'completed' without triggering double-booking validation

CREATE OR REPLACE FUNCTION validate_reservation_no_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow changes to cancelled or completed status without validation
  IF NEW.statut IN ('cancelled', 'completed') THEN
    RETURN NEW;
  END IF;
  
  -- For updates, only validate if dates or room changed, or if changing from inactive to active status
  IF TG_OP = 'UPDATE' THEN
    -- If only changing from active to active status without changing dates/room, allow it
    IF OLD.chambre_id = NEW.chambre_id 
       AND OLD.date_arrivee = NEW.date_arrivee 
       AND OLD.date_depart = NEW.date_depart
       AND OLD.statut NOT IN ('cancelled', 'completed')
       AND NEW.statut NOT IN ('cancelled', 'completed') THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Check if there are any conflicting reservations
  IF EXISTS (
    SELECT 1 
    FROM reservations 
    WHERE chambre_id = NEW.chambre_id
      AND id != COALESCE(NEW.id, -1)  -- Exclude current reservation when updating
      AND statut NOT IN ('cancelled', 'completed')  -- Ignore cancelled and completed reservations
      AND (
        -- Check for any date overlap
        (NEW.date_arrivee < date_depart AND NEW.date_depart > date_arrivee)
      )
  ) THEN
    RAISE EXCEPTION 'La chambre % n''est pas disponible du % au %. Une réservation existe déjà pour ces dates.', 
      NEW.chambre_id, NEW.date_arrivee, NEW.date_depart
      USING HINT = 'Vérifiez les réservations existantes pour cette chambre.',
      ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;