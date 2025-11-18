DELIMITER $$

CREATE TRIGGER trg_before_registration
BEFORE INSERT ON registrations
FOR EACH ROW
BEGIN
  DECLARE cap INT;
  DECLARE taken INT;

  SELECT capacity, seats_taken INTO cap, taken FROM events WHERE event_id = NEW.event_id;

  IF taken >= cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is full';
  END IF;
END $$

CREATE TRIGGER trg_after_registration
AFTER INSERT ON registrations
FOR EACH ROW
BEGIN
  UPDATE events SET seats_taken = seats_taken + 1 WHERE event_id = NEW.event_id;
END $$

CREATE TRIGGER trg_after_cancel
AFTER UPDATE ON registrations
FOR EACH ROW
BEGIN
  IF NEW.status='cancelled' AND OLD.status='registered' THEN
    UPDATE events SET seats_taken = seats_taken - 1 WHERE event_id = NEW.event_id;
  END IF;
END $$

DELIMITER ;
