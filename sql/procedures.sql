DELIMITER $$

CREATE PROCEDURE sp_create_user(
  IN p_name VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_phone VARCHAR(20),
  IN p_role VARCHAR(20),
  IN p_create TINYINT,
  IN p_manage TINYINT,
  OUT p_user_id INT
)
BEGIN
  INSERT INTO users(name,email,phone,role,can_create_events,can_manage_users)
  VALUES(p_name,p_email,p_phone,p_role,p_create,p_manage);
  SET p_user_id = LAST_INSERT_ID();
END $$

CREATE PROCEDURE sp_change_role(
  IN p_user INT,
  IN p_role VARCHAR(20),
  IN p_create TINYINT,
  IN p_manage TINYINT,
  IN p_by INT
)
BEGIN
  UPDATE users SET role=p_role, can_create_events=p_create, can_manage_users=p_manage
  WHERE user_id=p_user;
END $$

CREATE PROCEDURE sp_register_user(
  IN p_user INT,
  IN p_event INT,
  OUT p_msg VARCHAR(255)
)
BEGIN
  DECLARE cap INT;
  DECLARE taken INT;

  SELECT capacity, seats_taken INTO cap, taken FROM events WHERE event_id = p_event;

  IF taken >= cap THEN
    SET p_msg = 'Event full';
  ELSE
    INSERT INTO registrations(user_id,event_id) VALUES(p_user,p_event);
    SET p_msg = 'Registered successfully';
  END IF;
END $$

DELIMITER ;
