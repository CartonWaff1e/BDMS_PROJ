CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  role ENUM('student','organizer','admin') DEFAULT 'student',
  can_create_events TINYINT DEFAULT 0,
  can_manage_users TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  description TEXT,
  venue VARCHAR(200),
  start_time DATETIME,
  end_time DATETIME,
  capacity INT DEFAULT 50,
  seats_taken INT DEFAULT 0,
  created_by INT,
  FOREIGN KEY(created_by) REFERENCES users(user_id)
);

CREATE TABLE registrations (
  reg_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_id INT,
  status ENUM('registered','cancelled') DEFAULT 'registered',
  reg_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id),
  FOREIGN KEY(user_id) REFERENCES users(user_id),
  FOREIGN KEY(event_id) REFERENCES events(event_id)
);

CREATE TABLE feedback (
  feed_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_id INT,
  rating INT CHECK(rating between 1 and 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(user_id),
  FOREIGN KEY(event_id) REFERENCES events(event_id)
);
